
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}'::text[];

INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-documents', 'campaign-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'campaign-documents');
CREATE POLICY "Public can view documents" ON storage.objects FOR SELECT TO public USING (bucket_id = 'campaign-documents');
CREATE POLICY "Owners and admins can delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'campaign-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::public.app_role)));
