/*
# Create public storage bucket for companion images

1. Purpose
The admin panel uploads companion photos directly from the browser. Images are
stored in Supabase Storage under a public bucket so the returned public URLs can
be saved on the `companions` record and served to visitors without auth.

2. Setup
Run this in the Supabase SQL Editor, or via `supabase db push`. It creates the
`companion-images` bucket as public and allows the admin (and, for uploads, the
authenticated admin role) to write objects.

Note: The bucket is created via SQL using the storage schema. If you prefer, you
can also create it manually in the Supabase Dashboard under Storage -> New bucket
(name: `companion-images`, public: ON). Either works.
*/

-- Create the bucket if it does not exist (idempotent).
INSERT INTO storage.buckets (id, name, public)
VALUES ('companion-images', 'companion-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (the admin) to upload objects to this bucket.
DROP POLICY IF EXISTS "admin_upload_companion_images" ON storage.objects;
CREATE POLICY "admin_upload_companion_images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'companion-images' AND (storage.foldername(name))[1] = 'companion-images');

-- Allow authenticated users (the admin) to update/delete their uploaded objects.
DROP POLICY IF EXISTS "admin_update_companion_images" ON storage.objects;
CREATE POLICY "admin_update_companion_images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'companion-images');

DROP POLICY IF EXISTS "admin_delete_companion_images" ON storage.objects;
CREATE POLICY "admin_delete_companion_images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'companion-images');

-- Public read stays enabled because the bucket itself is public.
