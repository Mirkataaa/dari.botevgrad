
DROP POLICY IF EXISTS "Public can read campaign image files" ON storage.objects;

CREATE POLICY "Public can read campaign image files"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'campaign-images'
  AND name IS NOT NULL
  AND position('/' in name) > 0
  AND name !~ '/$'
);
