
-- Add main_image_index to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS main_image_index integer NOT NULL DEFAULT 0;

-- Campaign drafts table (pending edits)
CREATE TABLE public.campaign_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  submitted_by uuid NOT NULL,
  title text NOT NULL,
  short_description text,
  description text NOT NULL,
  category campaign_category NOT NULL,
  target_amount numeric NOT NULL,
  deadline timestamptz,
  images text[],
  documents text[],
  videos text[],
  main_image_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

-- Campaign versions (audit trail)
CREATE TABLE public.campaign_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  changed_by uuid NOT NULL,
  snapshot jsonb NOT NULL,
  change_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Campaign rejections
CREATE TABLE public.campaign_rejections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  draft_id uuid REFERENCES public.campaign_drafts(id) ON DELETE SET NULL,
  rejected_by uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Anti-spam trigger: max 3 campaigns per 24 hours
CREATE OR REPLACE FUNCTION public.check_campaign_spam()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.campaigns
  WHERE created_by = NEW.created_by
    AND created_at > now() - interval '24 hours';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Достигнат е лимитът от 3 кампании за 24 часа';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_campaign_spam
BEFORE INSERT ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION check_campaign_spam();

-- Version snapshot trigger: auto-log on campaign changes
CREATE OR REPLACE FUNCTION public.log_campaign_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.campaign_versions (campaign_id, changed_by, snapshot, change_type)
  VALUES (
    OLD.id,
    COALESCE(auth.uid(), OLD.created_by),
    to_jsonb(OLD),
    CASE
      WHEN TG_OP = 'UPDATE' THEN 'edited'
      ELSE 'other'
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_campaign_version
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION log_campaign_version();

-- RLS for campaign_drafts
ALTER TABLE public.campaign_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own drafts" ON public.campaign_drafts
FOR SELECT TO authenticated
USING (submitted_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators can insert drafts for own campaigns" ON public.campaign_drafts
FOR INSERT TO authenticated
WITH CHECK (
  submitted_by = auth.uid() AND
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_drafts.campaign_id AND campaigns.created_by = auth.uid())
);

CREATE POLICY "Admins can update drafts" ON public.campaign_drafts
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete drafts" ON public.campaign_drafts
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for campaign_versions
ALTER TABLE public.campaign_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators and admins can view versions" ON public.campaign_versions
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_versions.campaign_id AND campaigns.created_by = auth.uid())
);

CREATE POLICY "Authenticated can insert versions" ON public.campaign_versions
FOR INSERT TO authenticated
WITH CHECK (changed_by = auth.uid());

-- RLS for campaign_rejections
ALTER TABLE public.campaign_rejections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators and admins can view rejections" ON public.campaign_rejections
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_rejections.campaign_id AND campaigns.created_by = auth.uid())
);

CREATE POLICY "Admins can insert rejections" ON public.campaign_rejections
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
