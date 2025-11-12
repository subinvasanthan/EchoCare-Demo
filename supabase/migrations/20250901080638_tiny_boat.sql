/*
  # Setup Storage Policies for Profile Pictures

  1. Storage Configuration
    - Create `profile-pictures` bucket if it doesn't exist
    - Enable RLS on the bucket
    - Set bucket to be public for reading

  2. Security Policies
    - Allow authenticated users to upload their own profile pictures
    - Allow public read access to all profile pictures
    - Allow authenticated users to update their own profile pictures
    - Allow authenticated users to delete their own profile pictures

  3. Notes
    - Files are named with user ID prefix for security
    - Public read access allows profile pictures to be displayed
*/

-- Create the profile-pictures bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-pictures';

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all profile pictures
CREATE POLICY "Allow public read access to profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to update their own profile pictures
CREATE POLICY "Allow authenticated users to update own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own profile pictures
CREATE POLICY "Allow authenticated users to delete own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);