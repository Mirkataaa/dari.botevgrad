-- Recreate public_profiles view without organization columns
DROP VIEW IF EXISTS public.public_profiles;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_organization;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization_verified;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  id,
  full_name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;