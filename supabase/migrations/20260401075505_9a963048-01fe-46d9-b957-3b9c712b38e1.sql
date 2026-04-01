DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = on) AS
  SELECT id, full_name, avatar_url, is_organization, organization_name, organization_verified, created_at, updated_at
  FROM public.profiles;