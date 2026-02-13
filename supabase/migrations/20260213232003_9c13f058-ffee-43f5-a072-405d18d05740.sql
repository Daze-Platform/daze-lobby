
-- Fix INSERT policy on onboarding-assets
DROP POLICY IF EXISTS "Authenticated users can upload onboarding assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload onboarding assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'onboarding-assets'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_dashboard_access(auth.uid())
    OR (storage.foldername(name))[1] IN (SELECT client_id::text FROM public.user_clients WHERE user_id = auth.uid())
  )
);

-- Fix UPDATE policy on onboarding-assets
DROP POLICY IF EXISTS "Users can update their own onboarding assets" ON storage.objects;
CREATE POLICY "Users can update their own onboarding assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'onboarding-assets'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_dashboard_access(auth.uid())
    OR (storage.foldername(name))[1] IN (SELECT client_id::text FROM public.user_clients WHERE user_id = auth.uid())
  )
);

-- Fix DELETE policy on onboarding-assets
DROP POLICY IF EXISTS "Users can delete their own onboarding assets" ON storage.objects;
CREATE POLICY "Users can delete their own onboarding assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'onboarding-assets'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_dashboard_access(auth.uid())
    OR (storage.foldername(name))[1] IN (SELECT client_id::text FROM public.user_clients WHERE user_id = auth.uid())
  )
);
