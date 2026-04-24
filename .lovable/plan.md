## Security hardening — full sweep

This plan addresses every finding currently shown in the security panel. No user-visible flow is changed; only data access paths are tightened. Where the UI currently reads a sensitive column, we either drop the read (it's never displayed) or route it through a safe view.

---

### 1. `donations` table — hide Stripe IDs and donor PII

- Create / refresh the `public_donations` view (`security_invoker = on`) exposing only: `id, campaign_id, amount, donor_name (masked to "Анонимен" when anonymous), is_anonymous, status, created_at`.
- `REVOKE SELECT (stripe_payment_id, stripe_session_id, donor_name) ON public.donations FROM anon, authenticated`.
- Replace the broad `Anyone can view completed donations via view` policy with column-safe reads through the view only.
- Replace `Campaign creators can view campaign donations` with a policy that allows row visibility but combined with the column REVOKE so creators can't see Stripe IDs or anonymous donor names.
- Admins keep full SELECT (unchanged).
- App side: `useDonations` already uses `public_donations` — no UI change.

### 2. `subscriptions` table — hide Stripe IDs and donor email from creators

- Create `public_campaign_subscriptions` view (`security_invoker = on`) exposing only `id, campaign_id, amount, interval, status, created_at, current_period_end`.
- `REVOKE SELECT (donor_email, stripe_subscription_id, stripe_customer_id) ON public.subscriptions FROM authenticated`.
- Drop the existing `Campaign creators can view campaign subscriptions` policy; replace with one that grants read on the view only.
- Donors keep SELECT on their own rows but `stripe_*` columns are revoked from `authenticated`; donor self-view continues to work for the columns the UI actually reads.
- App side updates:
  - `useMySubscriptionForCampaign` — drop `stripe_subscription_id` from select (it isn't used in UI logic).
  - `useSubscriptions.ts` — `useMySubscriptions` selects explicit safe columns instead of `*`; `useCampaignSubscriptions` switches to the new view.
  - Remove `donor_email` / `stripe_subscription_id` from the exported `Subscription` interface.
  - Webhook + cancel-subscription edge functions keep using the service role (unaffected).

### 3. `profiles` table — minimal public exposure

- Drop the `Anyone can view public profile fields via view` blanket-true policy on `profiles`.
- Keep the existing `public_profiles` view (`security_invoker = on`) exposing only `id, full_name, avatar_url, is_organization, organization_name, organization_verified`.
- Add a tightly scoped policy on `profiles` that only allows anon/auth to SELECT the columns the view needs, OR (preferred) make the view `security definer` style by granting SELECT on the underlying columns to a dedicated role used by the view. We'll use the simpler proven pattern: keep `security_invoker` off on `public_profiles` so it runs as the view owner and bypasses RLS, then `REVOKE` direct anon SELECT on `profiles`.
- App side: any place fetching public profile data of *other* users moves to `public_profiles` (currently only `AdminUsers` reads `profiles.*` directly, which stays admin-only via the existing admin SELECT policy). Self-profile reads (`useProfile`, `Profile.tsx`) use the `Users can view own profile` policy and continue to work.

### 4. `campaign_versions` — verify ownership on insert

- Replace the INSERT policy with one that also requires the inserter to be the campaign's creator OR an admin (mirrors SELECT). Trigger `log_campaign_version` runs as `SECURITY DEFINER` so server-side audit logging is unaffected.

### 5. Realtime channel authorization

- Enable RLS on `realtime.messages` and add policies:
  - `campaigns` topic — anyone authenticated may subscribe.
  - `donations`, `subscriptions`, `contact_messages`, `campaign_drafts`, `campaign_rejections` topics — only admins may subscribe.
- Update `useRealtimeSync` callsites:
  - `Profile.tsx` listens to `donations` / `subscriptions` for *its own* user — switch these to a per-user topic the user is allowed on, OR move invalidation to a polling refetch on focus. We'll use the simpler approach: subscribe only on a dedicated user-scoped channel name and add a policy allowing `realtime.topic() = 'user:' || auth.uid()` reads. But since changes are driven by the webhook (service role), we can simply broadcast from the webhook on a `user:<uid>` channel. To keep the change small and non-breaking, we instead **stop** subscribing to `donations` / `subscriptions` realtime in `Profile.tsx` and rely on existing `refetchOnWindowFocus` + manual invalidation after `cancelMutation`. Donor confirmation already redirects through `PaymentSuccess` which invalidates queries.
  - `CampaignDetails.tsx` keeps `campaigns` (public) + drops `donations` / `subscriptions` realtime; progress bar invalidates on `campaigns` row change (already wired via webhook updating `current_amount`).
  - `AdminDonations.tsx` keeps `campaigns` realtime (admin allowed everywhere).

### 6. `translate-campaign` edge function — require auth

- Add `[functions.translate-campaign] verify_jwt = true` to `supabase/config.toml`.
- Add explicit JWT validation inside the function using `getClaims()`.
- Per platform policy, **no backend rate limiting will be added** (no primitives available).

### 7. `og-preview` edge function — close open redirect

- Hardcode an allow-list of origins: `https://dari-botevgrad.lovable.app` and the preview domain. Any `?origin=` value not in the list falls back to the default.

### 8. `campaign-documents` storage bucket — private + signed URLs

- Set bucket `public = false`.
- Drop the `Public can view documents` policy; add policy: SELECT allowed when `bucket_id = 'campaign-documents'` AND (uploader-owned folder OR admin OR row-level: the document URL appears in an `active` campaign — implemented via simpler rule: any authenticated user can SELECT, anon cannot). Reasoning: documents must be viewable by donors evaluating active campaigns, so we keep them accessible to authenticated users but stop anon listing/reading and stop public URLs.
- `CampaignDocuments.tsx` swaps `<a href={publicUrl}>` for a click handler that calls `supabase.storage.from('campaign-documents').createSignedUrl(path, 600)` and opens the result.
- Stored values in `campaigns.documents` today are full public URLs; we keep them as-is and parse the object path out of the URL on the client when generating signed URLs (no data migration required).

### 9. `campaign-images` bucket — keep public but stop listing

- Add a SELECT policy scoped to `bucket_id = 'campaign-images'` for individual objects (already effectively the case) and ensure no policy permits `LIST` on the bucket root for anon. Implemented by replacing any `USING (bucket_id = 'campaign-images')` SELECT policy with one that requires `name IS NOT NULL` and removing folder-listing capabilities. Images remain hot-linkable.
- Same treatment applied to `avatars` bucket.

### 10. Auth — leaked password protection

- Enable `password_hibp_enabled = true` via `configure_auth`. No UI change required; takes effect on next signup / password change.

---

### Files that will change

**Migrations (new):**
- `supabase/migrations/<ts>_security_hardening.sql` — all RLS / view / GRANT / REVOKE / realtime.messages policy changes.

**Edge functions:**
- `supabase/functions/translate-campaign/index.ts` — add JWT check.
- `supabase/functions/og-preview/index.ts` — origin allow-list.
- `supabase/config.toml` — add `verify_jwt = true` block for `translate-campaign`.

**Frontend:**
- `src/hooks/useSubscriptions.ts` — explicit safe column selects, switch creator query to view, prune `Subscription` interface.
- `src/hooks/useMySubscription.ts` — drop `stripe_subscription_id` from select and interface.
- `src/components/campaigns/CampaignDocuments.tsx` — signed-URL click handler.
- `src/pages/CampaignDetails.tsx` — remove `donations` / `subscriptions` realtime subscriptions.
- `src/pages/Profile.tsx` — remove `donations` / `subscriptions` realtime subscriptions; rely on `refetchOnWindowFocus` and post-mutation invalidation.

**Auth config:**
- Enable HIBP via `configure_auth` tool call.

---

### Risk / verification

- Donor & creator donation totals: unchanged (`current_amount` lives on the `campaigns` row, updated by webhook).
- Profile name & avatar everywhere: read via `public_profiles` view (already in use).
- My donations / my subscriptions in Profile: continue to work; only realtime auto-refresh is removed (focus-refetch covers it).
- Campaign documents: continue to download for any logged-in viewer; anonymous viewers will be prompted to log in via a friendly toast (added in `CampaignDocuments.tsx`).
- Translate-campaign: only callable by logged-in users (which is already the only place the UI invokes it from).

No data migrations are required and no destructive operations are performed.
