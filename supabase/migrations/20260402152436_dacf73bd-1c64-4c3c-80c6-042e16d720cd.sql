
-- Add campaign_type enum
CREATE TYPE public.campaign_type AS ENUM ('one_time', 'recurring');

-- Add campaign_type column to campaigns with default 'one_time'
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS campaign_type public.campaign_type NOT NULL DEFAULT 'one_time';

-- Create subscriptions table for tracking recurring donations
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_email text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  amount numeric NOT NULL,
  interval text NOT NULL DEFAULT 'month',
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  cancelled_at timestamp with time zone,
  current_period_end timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Donors can view own subscriptions
CREATE POLICY "Donors can view own subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (donor_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Campaign creators can view subscriptions for their campaigns
CREATE POLICY "Campaign creators can view campaign subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM campaigns WHERE campaigns.id = subscriptions.campaign_id AND campaigns.created_by = auth.uid()
));

-- Service role handles inserts/updates via webhook
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions FOR ALL TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Enable realtime for subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
