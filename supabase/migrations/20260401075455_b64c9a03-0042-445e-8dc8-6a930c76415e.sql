-- 1. Fix org verification self-bypass: revoke UPDATE on sensitive columns
REVOKE UPDATE (organization_verified, is_organization) ON TABLE public.profiles FROM authenticated;

-- 2. Fix storage upload policies for campaign-images and campaign-documents
DROP POLICY IF EXISTS "Authenticated users can upload campaign images" ON storage.objects;
CREATE POLICY "Authenticated users can upload campaign images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Fix Stripe IDs exposure: revoke SELECT on stripe columns from anon and authenticated
REVOKE SELECT (stripe_session_id, stripe_payment_id) ON TABLE public.donations FROM anon, authenticated;

-- 4. Fix phone number exposure: create a public profiles view without phone
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, full_name, avatar_url, is_organization, organization_name, organization_verified, created_at, updated_at
  FROM public.profiles;

-- 5. Remove donations from realtime publication to prevent broadcast leak
ALTER PUBLICATION supabase_realtime DROP TABLE public.donations;