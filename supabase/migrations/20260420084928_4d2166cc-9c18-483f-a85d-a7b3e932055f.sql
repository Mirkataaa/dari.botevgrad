-- Add English translation columns to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS short_description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Add English translation columns to campaign_drafts
ALTER TABLE public.campaign_drafts
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS short_description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;