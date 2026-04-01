
-- Create a public-safe view for donations (no Stripe IDs)
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

-- Grant access to the view
GRANT SELECT ON public.public_donations TO anon, authenticated;

-- Now restrict the original donations table: remove public SELECT, keep only owner + admin
DROP POLICY IF EXISTS "Public donations are viewable" ON public.donations;

CREATE POLICY "Donors can view own donations" ON public.donations
  FOR SELECT TO authenticated
  USING (donor_id = auth.uid());

CREATE POLICY "Admins can view all donations" ON public.donations
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
