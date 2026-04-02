
-- Drop the overly broad public SELECT policy
DROP POLICY IF EXISTS "Public can read completed donations via view" ON public.donations;

-- Add policy: campaign creators can view donations for their campaigns
CREATE POLICY "Campaign creators can view campaign donations"
ON public.donations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = donations.campaign_id
      AND campaigns.created_by = auth.uid()
  )
);
