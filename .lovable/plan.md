# Campaign Wizard – Plan

## Goal
Add a new guided, multi-step "Campaign Wizard" available to **any authenticated user**. It produces campaigns in the existing schema with `status = 'pending'`, requiring admin approval before going public. The current admin/verified-org form at `/campaigns/create` stays exactly as-is.

## Scope (no breaking changes)
- No DB schema changes.
- No payment logic changes.
- No edits to the existing `CreateCampaign.tsx` page or `OrgOrAdminRoute`.
- Same validation rules, same storage buckets, same fields (BG + EN), same submission shape.
- Admin moderation flow (`campaign_drafts` / `pending` campaigns) unchanged.

## New route
- `/campaigns/wizard` – wrapped only in `<Layout>` and an auth guard (redirect to `/login` if not signed in). No org/admin restriction.

## RLS update (required)
Today the `campaigns` INSERT policy `Verified orgs and admins can create campaigns` blocks regular users. We must allow any authenticated user to insert their own pending campaign without weakening the rest of the rules.

Replace the INSERT policy with:
```
auth.uid() = created_by
AND status = 'pending'
AND current_amount = 0
AND is_recommended = false
```
Effects:
- Admins/verified orgs continue to insert exactly as before (their existing form already sets `status='pending'`, `current_amount=0`, `is_recommended=false`).
- Regular users can now submit, but only as a pending campaign that still must be approved.
- The existing anti-spam trigger (`check_campaign_spam`, 10/24h) keeps protecting against abuse.
- Admin override remains via the separate "Admins can update campaigns" policy.

## Wizard UX (5 steps)
A single page component `src/pages/CampaignWizard.tsx` using a stepper. State held locally; only submitted at the final step.

```text
[1 Basics] -> [2 Story] -> [3 Goal] -> [4 Media] -> [5 Review & Submit]
```

1. **Basics** – Category (select), Campaign type toggle (one-time / recurring), Title (BG).
2. **Story** – Short description (BG, 10–300), Full description (BG, 30–10000). Optional EN tab with the same "Auto-translate" button used in the existing form (reuses the `translate-campaign` edge function).
3. **Goal** – Target amount (one-time only, 100–1 000 000 €), optional deadline (one-time only). Hidden for recurring.
4. **Media** – Up to 5 images (≤5MB each, pick main image), up to 5 documents (≤10MB), up to 3 video URLs. Same validation as today.
5. **Review & Submit** – Read-only summary of every field + a clear notice: "Кампанията ще бъде прегледана от администратор преди да стане публична." Submit button.

UI niceties:
- Progress bar + numbered step indicators at top.
- "Назад" / "Напред" buttons; "Напред" is disabled until current step passes its zod sub-schema.
- Per-step inline error messages.
- Mobile-friendly stacked layout.

## Submission behavior
Identical to the current form:
- Best-effort auto-translate on submit if EN fields are empty.
- Upload images to `campaign-images`, documents to `campaign-documents`.
- Insert into `campaigns` with `status='pending'`, `created_by=user.id`, `main_image_index`, `campaign_type`.
- On success: toast "Кампанията е създадена. Очаква одобрение." → redirect to `/profile` (so the user sees it in their pending list).

## Validation
Reuse the same zod rules as `CreateCampaign.tsx`, split into per-step schemas so we can validate progressively. Final submit re-validates the full object.

## Entry points
- **Header dropdown** (`src/components/layout/Header.tsx`): for any signed-in user who is **not** admin and **not** verified org, show a "Създай кампания" item that links to `/campaigns/wizard`. Admins/verified orgs keep their existing link to `/campaigns/create`.
- **Profile page**: small "Създай кампания" CTA for regular users linking to the wizard (non-blocking nice-to-have; can be added in the same change).

## Files
- **New**: `src/pages/CampaignWizard.tsx` (page + stepper logic).
- **New**: `src/components/campaigns/wizard/` – small step components (`StepBasics.tsx`, `StepStory.tsx`, `StepGoal.tsx`, `StepMedia.tsx`, `StepReview.tsx`) and a shared `WizardProgress.tsx`.
- **Edit**: `src/App.tsx` – register the `/campaigns/wizard` route behind a lightweight `RequireAuth` guard (inline or new tiny component).
- **Edit**: `src/components/layout/Header.tsx` – show wizard link for regular authenticated users.
- **Migration**: drop and recreate the `campaigns` INSERT RLS policy as described above.

## Out of scope
- No changes to `CreateCampaign.tsx`, `EditCampaign.tsx`, admin pages, edge functions, or payment code.
- No new tables or columns.
