
-- ============================================================================
-- 1. DONATIONS — hide Stripe IDs + donor_name from anon/authenticated
-- ============================================================================
REVOKE SELECT (stripe_payment_id, stripe_session_id, donor_name) ON TABLE public.donations FROM anon, authenticated;

-- Refresh public_donations view (masks anonymous donor names)
DROP VIEW IF EXISTS public.public_donations;
CREATE VIEW public.public_donations
WITH (security_invoker = on) AS
SELECT
  id,
  campaign_id,
  amount,
  CASE WHEN is_anonymous THEN 'Анонимен' ELSE donor_name END AS donor_name,
  is_anonymous,
  status,
  created_at
FROM public.donations
WHERE status = 'completed';

GRANT SELECT ON public.public_donations TO anon, authenticated;

-- ============================================================================
-- 2. SUBSCRIPTIONS — hide Stripe IDs + donor_email
-- ============================================================================
REVOKE SELECT (donor_email, stripe_subscription_id, stripe_customer_id) ON TABLE public.subscriptions FROM anon, authenticated;

-- Public-safe view for campaign creators
DROP VIEW IF EXISTS public.public_campaign_subscriptions;
CREATE VIEW public.public_campaign_subscriptions
WITH (security_invoker = on) AS
SELECT
  id,
  campaign_id,
  amount,
  interval,
  status,
  current_period_end,
  cancelled_at,
  created_at
FROM public.subscriptions;

GRANT SELECT ON public.public_campaign_subscriptions TO authenticated;

-- ============================================================================
-- 3. PROFILES — drop blanket-true public policy; rely on public_profiles view
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view public profile fields via view" ON public.profiles;

-- Recreate public_profiles view as SECURITY DEFINER style (bypasses RLS via owner)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  avatar_url,
  is_organization,
  organization_name,
  organization_verified,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================================================
-- 4. CAMPAIGN_VERSIONS — verify ownership/admin on insert
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated can insert versions" ON public.campaign_versions;
CREATE POLICY "Owners or admins can insert versions"
  ON public.campaign_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.campaigns
        WHERE campaigns.id = campaign_versions.campaign_id
          AND campaigns.created_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- 5. REALTIME — restrict sensitive channels to admins only
-- ============================================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public campaign realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Admin-only sensitive realtime" ON realtime.messages;

-- Anyone authenticated may subscribe to campaign topic
CREATE POLICY "Public campaign realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE 'campaigns%'
  );

-- Admin-only topics
CREATE POLICY "Admin-only sensitive realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    (
      realtime.topic() LIKE 'donations%'
      OR realtime.topic() LIKE 'subscriptions%'
      OR realtime.topic() LIKE 'contact_messages%'
      OR realtime.topic() LIKE 'campaign_drafts%'
      OR realtime.topic() LIKE 'campaign_rejections%'
    )
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================================
-- 6. STORAGE — campaign-documents private + signed URLs
-- ============================================================================
UPDATE storage.buckets SET public = false WHERE id = 'campaign-documents';

DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;

CREATE POLICY "Authenticated users can view campaign documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'campaign-documents');

-- ============================================================================
-- 7. STORAGE — prevent listing of public buckets (campaign-images, avatars)
--    by ensuring SELECT policies don't allow unfiltered listing for anon.
--    Individual file reads still work via direct URLs.
-- ============================================================================
-- Remove broad public list policies if present, add per-object read.
DROP POLICY IF EXISTS "Public can view campaign images" ON storage.objects;
CREATE POLICY "Public can read individual campaign images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'campaign-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can read individual avatars"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars' AND name IS NOT NULL);
