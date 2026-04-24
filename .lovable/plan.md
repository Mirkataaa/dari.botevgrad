## Goal

Replace the header "Register" button with a "Create Campaign" button, and ensure that after login or registration users land on the Campaign Wizard when that was their intended destination.

## Behavior

**Header (desktop & mobile, logged-out users):**
- Keep the "Login" button.
- Replace the "Register" button with a "Create Campaign" button (primary style).
- Clicking "Create Campaign" while logged out → navigate to `/register`, passing `from: "/campaigns/wizard"` in the route state.
- The login page already links to register; both pages will honor the `from` state and redirect there after success.

**Header (logged-in users):**
- No change. The user dropdown already exposes "Create Campaign" routing to the wizard for regular users (and `/campaigns/create` for admins/orgs). This stays as-is.

**Post-auth redirect:**
- `Login.tsx` and `Register.tsx` currently redirect to `/`. Update both to read `location.state.from` (fallback `/`) and redirect there after successful auth — both in the form-submit handler and in the `useEffect` that fires when an already-authenticated user lands on the page.
- Google OAuth on the login page: pass `redirect_uri` that includes the desired post-auth path so the user lands on the wizard after Google sign-in (when initiated from the Create Campaign flow).
- The Register page's "Already have account? Login" link will forward the same `from` state so the redirect target is preserved if the user switches to login.

**Unchanged:**
- Auth provider, signup/signin logic, RLS, campaign data structure, and the existing `/campaigns/create` flow for admins/orgs.

## Files to update

- `src/components/layout/Header.tsx` — swap the Register button for a "Create Campaign" button (desktop nav + mobile menu) that navigates to `/campaigns/wizard` if authenticated, else to `/register` with `state: { from: "/campaigns/wizard" }`.
- `src/pages/Login.tsx` — read `location.state?.from`, use it as the post-login redirect target in both the success handler and the already-authenticated `useEffect`; pass it through to the Google OAuth `redirect_uri`; preserve it on the "Register" link.
- `src/pages/Register.tsx` — same `from` handling for post-registration redirect (note: when email confirmation is required, this redirects to `/login` and forwards `from` so login completes the journey to the wizard); preserve `from` on the "Login" link.

## Translations

Reuse the existing `nav.createCampaign` translation key for the new button label (already used in the dropdown menu).

## Out of scope

- No changes to `AuthContext`, Supabase, RLS, or the wizard itself.
- No change to admin/organization creation flow.
