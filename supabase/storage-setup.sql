-- ============================================================
-- SUPABASE STORAGE SETUP
-- Run this in Supabase SQL Editor to set up profile photo storage
-- ============================================================

-- Create storage bucket for profile photos (run via Dashboard > Storage,
-- or use this SQL if storage schema is accessible)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow public read, allow inserts/updates from service role
CREATE POLICY "Public read access for profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Allow uploads to profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Allow updates to profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos');

-- ============================================================
-- NOTE: If running via SQL editor fails due to permissions,
-- create the bucket manually:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name: profile-photos
-- 4. Public bucket: YES
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp
-- ============================================================
