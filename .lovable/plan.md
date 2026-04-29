# Security Hardening Plan

Three areas to fix, all backwards-compatible — no UI or API changes.

---

## 1. Edge function error handling

**Files:** `create-checkout/index.ts`, `create-subscription/index.ts`, `cancel-subscription/index.ts`

Currently every `catch` returns `error.message` directly to the client. We will:

- Define a small set of **known, safe-to-show** error messages (validation, "Campaign not found", "Trябва да сте влезли", "Вече имате активен абонамент", "Invalid amount", etc.) — these are already user-facing in Bulgarian and the UI relies on them.
- For any other thrown error (Stripe API errors, DB errors, JSON parse, network), log the full error server-side via `console.error` and return a generic `"Възникна неочаквана грешка. Моля опитайте отново."` with status 500.
- Keep status 400 for validation errors, 401 for auth errors, 500 for unexpected.

Pattern:
```ts
const SAFE_MESSAGES = new Set([
  "Invalid campaign or amount",
  "Campaign not found",
  "Campaign is not active",
  // ...the curated list per function
]);

catch (error: any) {
  console.error("[fn-name] Error:", error);
  const msg = SAFE_MESSAGES.has(error?.message) ? error.message
    : "Възникна неочаквана грешка. Моля опитайте отново.";
  const status = SAFE_MESSAGES.has(error?.message) ? 400 : 500;
  return new Response(JSON.stringify({ error: msg }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }, status,
  });
}
```

This preserves all current toasts shown by `DonateButton` and the subscription UI because those known strings are still passed through.

---

## 2. Storage ownership validation

**Important context:** The actual upload code stores files at `{auth.uid()}/timestamp-random.ext` (verified via `storage.objects` rows). The first folder segment is the **uploader's user_id**, not a campaign_id. So the scanner's literal suggestion ("extract campaign_id from path") doesn't apply — there is no campaign_id in the path.

What the existing policies cover:
- `campaign-images`: INSERT/DELETE checked against folder=auth.uid(); **UPDATE policy missing**
- `campaign-documents`: INSERT/DELETE checked; **UPDATE policy missing**
- `campaign-videos`: INSERT/UPDATE/DELETE all check folder=auth.uid() ✓

Migration will:

1. Add missing **UPDATE** policies for `campaign-images` and `campaign-documents` (folder must equal `auth.uid()` OR admin) — closes the gap the scanner flagged.
2. Tighten existing INSERT/UPDATE/DELETE policies on all three buckets so the user must:
   - own the folder (`foldername[1] = auth.uid()::text`), AND
   - have at least one campaign they created (prevents random authenticated users from littering buckets even if they never ran a campaign).
3. Admins keep full access via `has_role(auth.uid(), 'admin')`.
4. Public SELECT for `campaign-images` and `campaign-videos` stays unchanged (buckets are public).

Reads of campaign-documents stay restricted to authenticated users (current behavior).

---

## 3. SECURITY DEFINER function grants

Audit of the 11 SECURITY DEFINER functions in `public`:

| Function | Used by | Action |
|---|---|---|
| `has_role` | RLS policies (server context) | Revoke from anon; keep for authenticated (RLS needs it) |
| `handle_new_user` | Auth trigger only | Revoke from anon, authenticated, public |
| `check_campaign_completion` | Trigger | Revoke from anon, authenticated, public |
| `check_campaign_spam` | Trigger | Revoke from anon, authenticated, public |
| `log_campaign_version` | Trigger | Revoke from anon, authenticated, public |
| `close_expired_campaigns` | Cron/admin only | Revoke from anon, authenticated, public; grant to service_role |
| `mark_review_notifications_seen` | Called from client by authenticated users | Keep authenticated; revoke from anon. Already checks `auth.uid()` internally ✓ |
| `enqueue_email`, `delete_email`, `read_email_batch`, `move_to_dlq` | Edge functions using service_role | Revoke from anon, authenticated; grant to service_role |

All trigger-only functions don't need any role grant — triggers run as table owner regardless. Revoking is safe.

`mark_review_notifications_seen` already filters by `submitted_by = auth.uid()` and `created_by = auth.uid()` inside the body, so it cannot be abused even though it stays callable by authenticated users.

---

## Migration files

One SQL migration containing:
- New/updated storage RLS policies (drop+recreate for the affected ones)
- `REVOKE EXECUTE` and selective `GRANT EXECUTE` on the 11 functions

## Verification

After applying:
- Re-run the security scan; the three findings (`raw_error_msgs`, `campaign_videos_no_update_check`, both SECURITY DEFINER lints) should clear.
- Manual sanity: a logged-in donor can still donate (one-time + subscription); a campaign creator can still upload images/docs/videos and edit campaigns; admins can still moderate.
- Update `mem://` security memory to record the per-user folder ownership model so future scans/agents don't re-suggest the campaign_id-in-path approach.
