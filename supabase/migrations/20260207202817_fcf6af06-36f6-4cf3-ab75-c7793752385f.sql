-- Drop the existing client upload policy for contracts
DROP POLICY IF EXISTS "Clients can upload contracts to their folder" ON storage.objects;

-- Create a new policy that checks hotel access via client_hotels table
CREATE POLICY "Clients can upload contracts to their hotel folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' AND
  (
    -- User has hotel access via client_hotels
    (storage.foldername(name))[1] IN (
      SELECT hotel_id::text FROM client_hotels WHERE user_id = auth.uid()
    )
    OR
    -- Or is admin
    is_admin(auth.uid())
  )
);

-- Also update the view/select policy for consistency
DROP POLICY IF EXISTS "Clients can download their own contracts" ON storage.objects;

CREATE POLICY "Clients can download their hotel contracts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'contracts' AND
  (
    -- User has hotel access via client_hotels
    (storage.foldername(name))[1] IN (
      SELECT hotel_id::text FROM client_hotels WHERE user_id = auth.uid()
    )
    OR
    -- Or is admin/dashboard user
    has_dashboard_access(auth.uid())
  )
);

-- Update the update policy
DROP POLICY IF EXISTS "Clients can update their own contracts" ON storage.objects;

CREATE POLICY "Clients can update their hotel contracts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'contracts' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT hotel_id::text FROM client_hotels WHERE user_id = auth.uid()
    )
    OR
    has_dashboard_access(auth.uid())
  )
);

-- Update the delete policy
DROP POLICY IF EXISTS "Clients can delete their own contracts" ON storage.objects;

CREATE POLICY "Clients can delete their hotel contracts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'contracts' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT hotel_id::text FROM client_hotels WHERE user_id = auth.uid()
    )
    OR
    has_dashboard_access(auth.uid())
  )
);