-- Drop old storage policies that reference the old client_hotels table
DROP POLICY IF EXISTS "Clients can view their hotel documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload their hotel documents to storage" ON storage.objects;

-- Recreate with correct table reference (user_clients instead of client_hotels)
-- Clients can only VIEW/DOWNLOAD documents - no upload permission (admin-uploaded only)
CREATE POLICY "Clients can view their hotel documents in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'hotel-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT client_id::text FROM user_clients WHERE user_id = auth.uid()
  )
);