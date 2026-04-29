
DROP POLICY IF EXISTS "Authenticated users can upload campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own campaign documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own campaign videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own campaign videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own campaign videos" ON storage.objects;

CREATE POLICY "Campaign images: owners can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'campaign-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.campaigns c WHERE c.created_by = auth.uid())
  )
);

CREATE POLICY "Campaign images: owners can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'campaign-images'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      (storage.foldername(name))[1] = (auth.uid())::text
      AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.created_by = auth.uid())
    )
  )
)
WITH CHECK (
  bucket_id = 'campaign-images'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (storage.foldername(name))[1] = (auth.uid())::text
  )
);

CREATE POLICY "Campaign images: owners can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'campaign-images'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (storage.foldername(name))[1] = (auth.uid())::text
  )
);

CREATE POLICY "Campaign documents: owners can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'campaign-documents'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.campaigns c WHERE c.created_by = auth.uid())
  )
);

CREATE POLICY "Campaign documents: owners can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'campaign-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      (storage.foldername(name))[1] = (auth.uid())::text
      AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.created_by = auth.uid())
    )
  )
)
WITH CHECK (
  bucket_id = 'campaign-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (storage.foldername(name))[1] = (auth.uid())::text
  )
);

CREATE POLICY "Campaign documents: owners can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'campaign-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (storage.foldername(name))[1] = (auth.uid())::text
  )
);

CREATE POLICY "Campaign videos: owners can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'campaign-videos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.campaigns c WHERE c.created_by = auth.uid())
  )
);

CREATE POLICY "Campaign videos: owners can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'campaign-videos'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      (storage.foldername(name))[1] = (auth.uid())::text
      AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.created_by = auth.uid())
    )
  )
)
WITH CHECK (
  bucket_id = 'campaign-videos'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (storage.foldername(name))[1] = (auth.uid())::text
  )
);

CREATE POLICY "Campaign videos: owners can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'campaign-videos'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (storage.foldername(name))[1] = (auth.uid())::text
  )
);

REVOKE EXECUTE ON FUNCTION public.handle_new_user()                             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_campaign_completion()                   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_campaign_spam()                         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_campaign_version()                        FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.close_expired_campaigns()                     FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.close_expired_campaigns()                     TO service_role;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)        FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)                    TO service_role;
GRANT  EXECUTE ON FUNCTION public.delete_email(text, bigint)                    TO service_role;
GRANT  EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer)      TO service_role;
GRANT  EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)        TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)               FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)               TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.mark_review_notifications_seen(uuid)          FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.mark_review_notifications_seen(uuid)          TO authenticated;
