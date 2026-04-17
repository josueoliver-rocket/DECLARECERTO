-- Create storage bucket for brokerage note PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-pdf', 'notas-pdf', false);

-- Policy: Users can upload their own PDFs
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'notas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can view their own PDFs
CREATE POLICY "Users can view their own PDFs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'notas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own PDFs
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
USING (bucket_id = 'notas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);