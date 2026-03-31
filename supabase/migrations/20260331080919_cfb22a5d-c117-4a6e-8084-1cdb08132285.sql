
-- Add 'closed' to campaign_status enum
ALTER TYPE public.campaign_status ADD VALUE IF NOT EXISTS 'closed';

-- Add is_recommended column to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS is_recommended boolean NOT NULL DEFAULT false;
