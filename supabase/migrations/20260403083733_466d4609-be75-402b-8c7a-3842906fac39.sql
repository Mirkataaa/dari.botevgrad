
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT 
  id,
  full_name,
  avatar_url,
  is_organization,
  organization_name,
  organization_verified,
  created_at,
  updated_at
FROM profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Also ensure public_donations is accessible
DROP VIEW IF EXISTS public.public_donations;
CREATE VIEW public.public_donations
WITH (security_invoker = true)
AS SELECT
  id,
  campaign_id,
  CASE WHEN is_anonymous = true THEN 'Анонимен' ELSE donor_name END AS donor_name,
  amount,
  is_anonymous,
  status,
  created_at
FROM donations
WHERE status = 'completed';

GRANT SELECT ON public.public_donations TO anon, authenticated;

-- Since public_profiles now uses security_invoker, we need a public SELECT policy on profiles
CREATE POLICY "Anyone can view public profile fields via view"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);
