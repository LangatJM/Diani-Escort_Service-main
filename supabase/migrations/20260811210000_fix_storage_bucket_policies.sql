/*
  Fix Supabase Storage Bucket setup & RLS policies for companion images.
  Ensures bucket 'companion-images' is public and allows image uploads.
*/

-- 1. Create the public bucket 'companion-images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('companion-images', 'companion-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public upload (INSERT) for companion-images
DROP POLICY IF EXISTS "allow_companion_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "admin_upload_companion_images" ON storage.objects;
CREATE POLICY "allow_companion_images_insert" ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'companion-images');

-- 3. Allow UPDATE for companion-images
DROP POLICY IF EXISTS "allow_companion_images_update" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_companion_images" ON storage.objects;
CREATE POLICY "allow_companion_images_update" ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'companion-images');

-- 4. Allow DELETE for companion-images
DROP POLICY IF EXISTS "allow_companion_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_companion_images" ON storage.objects;
CREATE POLICY "allow_companion_images_delete" ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'companion-images');

-- 5. Allow public read access to companion-images
DROP POLICY IF EXISTS "allow_companion_images_select" ON storage.objects;
CREATE POLICY "allow_companion_images_select" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'companion-images');
