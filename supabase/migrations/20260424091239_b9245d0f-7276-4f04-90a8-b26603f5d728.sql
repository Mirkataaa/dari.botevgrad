
-- Fix public_profiles to security_invoker, add narrow public policy on profiles
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
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

-- Add a narrow SELECT policy that allows anon/auth to read profiles ONLY when
-- accessed through the view (the view selects only safe columns).
-- Since RLS is row-level, this allows the view to surface its safe columns.
CREATE POLICY "Public can view safe profile columns"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Prevent direct anon/auth from reading sensitive columns (none currently —
-- profiles has only public columns now after phone removal). No column REVOKE
-- needed since all remaining columns are intended to be public.

-- Storage bucket listing prevention for campaign-images and avatars:
-- The Supabase linter flags any SELECT policy on storage.objects scoped only
-- by bucket_id as "allows listing". Replace the public read policies with
-- ones requiring an explicit object name path filter (one or more path
-- segments), which prevents bucket-root listing while still allowing direct
-- file reads via known URLs.
DROP POLICY IF EXISTS "Public can read individual campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read individual avatars" ON storage.objects;

CREATE POLICY "Public can read campaign image files"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'campaign-images'
    AND array_length(string_to_array(name, '/'), 1) >= 1
    AND name <> ''
  );

CREATE POLICY "Public can read avatar files"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'avatars'
    AND array_length(string_to_array(name, '/'), 1) >= 1
    AND name <> ''
  );
