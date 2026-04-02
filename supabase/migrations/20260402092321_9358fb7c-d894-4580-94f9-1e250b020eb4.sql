
-- Trigger function to auto-complete campaigns when target is reached
CREATE OR REPLACE FUNCTION public.check_campaign_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When current_amount reaches or exceeds target_amount, mark as completed
  IF NEW.current_amount >= NEW.target_amount AND NEW.status = 'active' THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on campaigns table
DROP TRIGGER IF EXISTS trg_check_campaign_completion ON public.campaigns;
CREATE TRIGGER trg_check_campaign_completion
  BEFORE UPDATE OF current_amount ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.check_campaign_completion();

-- Function to close campaigns past their deadline (called via cron or edge function)
CREATE OR REPLACE FUNCTION public.close_expired_campaigns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campaigns
  SET status = 'completed'
  WHERE status = 'active'
    AND deadline IS NOT NULL
    AND deadline < now();
END;
$$;

-- Allow admins to delete campaigns
CREATE POLICY "Admins can delete campaigns"
  ON public.campaigns
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
