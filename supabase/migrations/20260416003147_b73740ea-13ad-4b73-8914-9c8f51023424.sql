INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-images', 'campaign-images', true);

CREATE POLICY "Staff can upload campaign images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can update campaign images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete campaign images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Campaign images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');