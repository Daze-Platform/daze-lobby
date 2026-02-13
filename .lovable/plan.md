

## Fix: File Upload RLS Policy for Client Portal

### Root Cause

The `onboarding-assets` storage bucket has an INSERT policy that only allows uploads when the first folder in the path matches `auth.uid()`:

```
(auth.uid())::text = (storage.foldername(name))[1] OR has_dashboard_access(auth.uid())
```

However, the upload code in `useClientPortal.ts` uses the **client ID** as the folder path (e.g., `{clientId}/logo_dark_...`). Since a client user's `auth.uid()` is different from their `client_id`, the policy blocks the upload.

The same mismatch exists for the UPDATE and DELETE policies on this bucket.

### Fix

Update three storage RLS policies on the `onboarding-assets` bucket to also allow access when the folder matches the user's assigned client ID (via `user_clients` table), matching the pattern already used by the `contracts` bucket.

### Technical Details

**Database migration** -- update 3 storage policies:

1. **INSERT** (`Authenticated users can upload onboarding assets`):
   - Add: `OR (storage.foldername(name))[1] IN (SELECT client_id::text FROM user_clients WHERE user_id = auth.uid())`

2. **UPDATE** (`Users can update their own onboarding assets`):
   - Add the same client-folder check

3. **DELETE** (`Users can delete their own onboarding assets`):
   - Add the same client-folder check

No code changes needed -- the upload paths are already correct. Only the storage policies need updating.
