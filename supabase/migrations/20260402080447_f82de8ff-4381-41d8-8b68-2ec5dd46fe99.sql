
-- Switch view to security_invoker so it respects RLS
CREATE OR REPLACE VIEW public.public_donations WITH (security_invoker = on) AS
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

GRANT SELECT ON public.public_donations TO anon, authenticated;

-- Add back a SELECT policy for completed donations (view needs it)
CREATE POLICY "Public can read completed donations via view" ON public.donations
  FOR SELECT TO anon, authenticated
  USING (status = 'completed');
