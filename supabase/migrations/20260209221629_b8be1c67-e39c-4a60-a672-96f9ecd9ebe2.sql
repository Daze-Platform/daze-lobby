DROP POLICY IF EXISTS "Authenticated users can upload onboarding assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload onboarding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'onboarding-assets'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_dashboard_access(auth.uid())
  )
);