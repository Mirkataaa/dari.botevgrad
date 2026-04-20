-- Add 'sports' to campaign_category enum
ALTER TYPE public.campaign_category ADD VALUE IF NOT EXISTS 'sports';

-- Add 'archived' to campaign_status enum
ALTER TYPE public.campaign_status ADD VALUE IF NOT EXISTS 'archived';

-- Update public SELECT policy: archived campaigns are NOT publicly visible.
-- Creators and admins still see them.
DROP POLICY IF EXISTS "Campaigns viewable by everyone" ON public.campaigns;

CREATE POLICY "Campaigns viewable by everyone"
ON public.campaigns
FOR SELECT
TO public
USING (
  (status = ANY (ARRAY['active'::campaign_status, 'completed'::campaign_status, 'closed'::campaign_status]))
  OR (auth.uid() = created_by)
  OR has_role(auth.uid(), 'admin'::app_role)
);