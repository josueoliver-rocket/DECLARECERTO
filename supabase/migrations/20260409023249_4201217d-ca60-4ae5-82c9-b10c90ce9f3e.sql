
-- Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the old public SELECT policy if it exists
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Create authenticated-only SELECT policy scoped to user's own folder
CREATE POLICY "Users can view their own avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
