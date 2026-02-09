

# Fix Logo Upload RLS Error

## Problem
The storage INSERT policy on `onboarding-assets` requires the first folder in the file path to match `auth.uid()`. The admin logo upload in `AdminBrandPosControls.tsx` uses the path `brands/{clientId}/{fileName}`, where the first folder is `"brands"` -- not the user's UID -- causing the RLS violation.

## Solution
Update the storage RLS INSERT policy on `onboarding-assets` to also allow admin/ops_manager users to upload to any path.

### Database Migration (SQL)
```sql
DROP POLICY "Authenticated users can upload onboarding assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload onboarding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'onboarding-assets'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_dashboard_access(auth.uid())
  )
);
```

This adds `OR has_dashboard_access(auth.uid())` so admins and ops managers can upload to any folder path (like `brands/{clientId}/...`), while regular client users still must upload under their own UID folder.

### No Code Changes Needed
The upload code in `AdminBrandPosControls.tsx` is correct -- only the storage policy needs updating.

