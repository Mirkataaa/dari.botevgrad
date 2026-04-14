CREATE POLICY "Anyone can view completed donations via view"
ON public.donations
FOR SELECT
TO anon, authenticated
USING (status = 'completed');