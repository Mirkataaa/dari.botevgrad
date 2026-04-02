
-- 1. DONATIONS: Remove public SELECT policy
DROP POLICY IF EXISTS "Public can read completed donations" ON public.donations;

-- 2. DONATIONS: Tighten INSERT policies
DROP POLICY IF EXISTS "Anyone can create a donation" ON public.donations;
DROP POLICY IF EXISTS "Anonymous donations allowed" ON public.donations;

CREATE POLICY "Authenticated users can create pending donations" ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK (donor_id = auth.uid() AND status = 'pending' AND stripe_payment_id IS NULL AND amount > 0);

CREATE POLICY "Anonymous users can create pending donations" ON public.donations
  FOR INSERT TO anon
  WITH CHECK (donor_id IS NULL AND status = 'pending' AND stripe_payment_id IS NULL AND amount > 0);

-- 3. USER_ROLES: Recreate policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. CAMPAIGNS: Split UPDATE policy
DROP POLICY IF EXISTS "Creators and admins can update campaigns" ON public.campaigns;

CREATE POLICY "Admins can update campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators can update own pending campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by AND status = 'pending')
  WITH CHECK (
    auth.uid() = created_by
    AND status = 'pending'
    AND is_recommended = false
    AND current_amount = 0
  );

-- 5. FIX FUNCTION SEARCH PATHS (email queue functions)
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

-- 6. FIX contact_messages INSERT
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) > 0 AND length(name) <= 200
    AND length(email) > 0 AND length(email) <= 320
    AND length(message) > 0 AND length(message) <= 5000
  );

-- 7. Recreate public_donations view
CREATE OR REPLACE VIEW public.public_donations AS
SELECT
  id,
  campaign_id,
  amount,
  CASE WHEN is_anonymous = true THEN NULL ELSE donor_name END AS donor_name,
  is_anonymous,
  status,
  created_at
FROM public.donations
WHERE status = 'completed';

GRANT SELECT ON public.public_donations TO anon, authenticated;
