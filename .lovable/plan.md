

## Reset all Stripe-related data in the database

Since both Stripe accounts are test accounts, we can safely wipe all payment-related records from the database. Old donations and subscriptions reference Stripe IDs from the old test account that won't exist in the new one — keeping them would cause confusion (broken refs, orphaned subscriptions, inflated campaign totals).

### Answers to your questions

- **Yes** — if both Stripe accounts are test mode, deleting test data on Stripe's side has no real-world impact (no real money, no real customers).
- **Yes** — you should also delete the test data from the old Stripe dashboard (Developers → "Delete all test data") so the old account is clean. That's done by you on stripe.com, not from here.

### What will be deleted from the database

| Table | Records affected | Why |
|---|---|---|
| `donations` | ALL rows | Every donation references a Stripe payment/session ID from the old account |
| `subscriptions` | ALL rows | Every subscription references a Stripe subscription/customer ID from the old account |
| `campaigns.current_amount` | Reset to `0` for every campaign | Recomputed from donations — must match the now-empty donations table |

### What will NOT be touched

- Campaigns themselves (titles, descriptions, images, status, categories, creators)
- Users, profiles, roles (admin, organizations)
- Comments, votes, updates, drafts, version history
- Email logs, contact messages
- Storage buckets (images, documents, avatars)

### Execution

Single SQL operation via the data tool (not a migration — this is a data delete, not a schema change):

```sql
DELETE FROM public.donations;
DELETE FROM public.subscriptions;
UPDATE public.campaigns SET current_amount = 0;
```

### After this runs

1. You update `STRIPE_SECRET_KEY` with the new account's secret key (secure prompt).
2. You add a webhook endpoint in the new Stripe dashboard pointing to:
   `https://zjzyybdvbgovnvftnfod.supabase.co/functions/v1/stripe-webhook`
   with events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
3. You update `STRIPE_WEBHOOK_SECRET` with the new signing secret (secure prompt).
4. Make a test donation end-to-end to confirm the new account is wired correctly.

### Technical details

- No code changes, no migrations, no RLS changes.
- Operation is irreversible — once approved, the donation/subscription history is gone permanently. Since this is test data, that's the intended outcome.
- Campaign progress bars will all show 0% until new test donations are made.

