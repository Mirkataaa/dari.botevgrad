DROP POLICY IF EXISTS "Verified orgs and admins can create campaigns" ON public.campaigns;

CREATE POLICY "Authenticated users can submit pending campaigns"
ON public.campaigns
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND status = 'pending'::campaign_status
  AND current_amount = 0
  AND is_recommended = false
);