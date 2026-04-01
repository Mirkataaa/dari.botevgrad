
-- Switch view back to security_invoker
CREATE OR REPLACE VIEW public.public_donations WITH (security_invoker = on) AS
SELECT
  id,
  campaign_id,
  amount,
  CASE WHEN is_anonymous = true THEN NULL ELSE donor_name END AS donor_name,
  is_anonymous,
  status,
  created_at
FROM public.donations;

GRANT SELECT ON public.public_donations TO anon, authenticated;

-- Add a public-read policy for completed donations (limited columns enforced by view)
CREATE POLICY "Public can read completed donations" ON public.donations
  FOR SELECT TO anon, authenticated
  USING (status = 'completed');
