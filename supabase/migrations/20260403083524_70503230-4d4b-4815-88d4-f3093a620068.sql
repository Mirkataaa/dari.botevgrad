
-- 1. Fix recurring campaigns: exclude them from auto-completion trigger
CREATE OR REPLACE FUNCTION public.check_campaign_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.campaign_type = 'recurring' THEN
    RETURN NEW;
  END IF;
  IF NEW.current_amount >= NEW.target_amount AND NEW.status = 'active' THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Fix recurring campaigns: exclude them from cron expiry
CREATE OR REPLACE FUNCTION public.close_expired_campaigns()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.campaigns
  SET status = 'completed'
  WHERE status = 'active'
    AND campaign_type = 'one_time'
    AND deadline IS NOT NULL
    AND deadline < now();
END;
$function$;

-- 3. Increase spam limit from 3 to 10
CREATE OR REPLACE FUNCTION public.check_campaign_spam()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recent_count integer;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.campaigns
  WHERE created_by = NEW.created_by
    AND created_at > now() - interval '24 hours';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Достигнат е лимитът от 10 кампании за 24 часа';
  END IF;

  RETURN NEW;
END;
$function$;
