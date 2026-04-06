ALTER TABLE public.campaign_drafts
ADD COLUMN IF NOT EXISTS seen_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_active_per_user_campaign_idx
ON public.subscriptions (donor_id, campaign_id)
WHERE donor_id IS NOT NULL AND status IN ('active', 'cancelling');

CREATE UNIQUE INDEX IF NOT EXISTS donations_unique_stripe_payment_id_idx
ON public.donations (stripe_payment_id)
WHERE stripe_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS donations_unique_stripe_session_id_idx
ON public.donations (stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.mark_review_notifications_seen(_campaign_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.campaign_drafts
  SET seen_at = now()
  WHERE submitted_by = auth.uid()
    AND status IN ('approved', 'rejected')
    AND reviewed_at IS NOT NULL
    AND seen_at IS NULL
    AND (_campaign_id IS NULL OR campaign_id = _campaign_id);

  UPDATE public.campaign_rejections cr
  SET seen_at = now()
  WHERE cr.seen_at IS NULL
    AND (_campaign_id IS NULL OR cr.campaign_id = _campaign_id)
    AND EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = cr.campaign_id
        AND c.created_by = auth.uid()
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.mark_review_notifications_seen(uuid) TO authenticated;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_drafts;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_rejections;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;