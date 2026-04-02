
-- Add seen_at to campaign_rejections for tracking creator notification dismissal
ALTER TABLE public.campaign_rejections ADD COLUMN IF NOT EXISTS seen_at timestamp with time zone DEFAULT NULL;

-- Add is_read to contact_messages for tracking admin read status
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- Allow admins to update contact_messages (mark as read)
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow creators to update their own rejections (mark as seen)
CREATE POLICY "Creators can update own rejections seen_at"
ON public.campaign_rejections
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_rejections.campaign_id
    AND campaigns.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_rejections.campaign_id
    AND campaigns.created_by = auth.uid()
  )
);

-- Enable realtime for notification-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_rejections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
