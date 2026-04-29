-- Restore EXECUTE on has_role for anon and authenticated.
-- This function is referenced inside RLS policies of publicly-readable tables
-- (campaigns, comments, donations, etc.). Without EXECUTE for anon, every public
-- SELECT fails with 42501 "permission denied for function has_role".
-- The function is SECURITY DEFINER, returns only a boolean from user_roles,
-- and for anon (auth.uid() IS NULL) it always returns false — safe to expose.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;