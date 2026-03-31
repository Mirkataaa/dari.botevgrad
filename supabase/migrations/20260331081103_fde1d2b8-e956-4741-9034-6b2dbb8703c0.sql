
-- Update RLS policy to include 'closed' campaigns as publicly viewable
DROP POLICY IF EXISTS "Campaigns viewable by everyone" ON public.campaigns;
CREATE POLICY "Campaigns viewable by everyone"
ON public.campaigns FOR SELECT TO public
USING (
  (status = ANY (ARRAY['active'::campaign_status, 'completed'::campaign_status, 'closed'::campaign_status]))
  OR (auth.uid() = created_by)
  OR has_role(auth.uid(), 'admin'::app_role)
);
