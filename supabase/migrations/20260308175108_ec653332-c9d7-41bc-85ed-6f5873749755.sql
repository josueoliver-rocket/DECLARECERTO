CREATE POLICY "Users can update their own PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'notas-pdf' AND (auth.uid())::text = (storage.foldername(name))[1]);