
-- Recreate view without security_invoker so it runs as owner (bypasses RLS on donations)
CREATE OR REPLACE VIEW public.public_donations AS
SELECT
  id,
  campaign_id,
  amount,
  CASE WHEN is_anonymous = true THEN NULL ELSE donor_name END AS donor_name,
  is_anonymous,
  status,
  created_at
FROM public.donations;

-- Ensure access
GRANT SELECT ON public.public_donations TO anon, authenticated;
