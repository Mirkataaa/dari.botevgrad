
-- Recreate view without security_invoker (defaults to SECURITY DEFINER behavior)
DROP VIEW IF EXISTS public.public_donations;

CREATE VIEW public.public_donations AS
SELECT
  id,
  campaign_id,
  amount,
  CASE WHEN is_anonymous = true THEN NULL ELSE donor_name END AS donor_name,
  is_anonymous,
  status,
  created_at
FROM public.donations
WHERE status = 'completed';

-- Re-grant access
GRANT SELECT ON public.public_donations TO anon, authenticated;
