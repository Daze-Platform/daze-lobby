

# Fix Client Logo Upload and Persistence

## Problem
The logo upload mutation in `ClientDetailPanel.tsx` has no error or success callbacks with user feedback. If the upload fails (e.g., due to file size, network issue, or storage policy), the error is silently swallowed -- the admin has no idea what happened. Additionally, there's no success toast to confirm the upload worked.

## Root Cause
The `logoUpload` mutation (lines 221-242) only has an `onSuccess` that invalidates the query cache, but:
1. **No `onError` handler** -- upload/DB failures produce no toast or visual feedback
2. **No success toast** -- even when the upload works, there's no confirmation message
3. **No `onSettled` cleanup** -- the file input is cleared inline, but if the mutation errors, the loading state may linger

## Fix

### `src/components/dashboard/ClientDetailPanel.tsx`

Add `onError` and update `onSuccess` on the `logoUpload` mutation:

- **`onSuccess`**: Keep the existing `invalidateQueries` call and add `toast.success("Logo updated")`
- **`onError`**: Add `toast.error("Failed to upload logo: " + error.message)` so admins see what went wrong

This matches the exact pattern already used by `AdminBrandPosControls.tsx` (lines 100-110) for the same logo upload flow.

### Files Modified
- **`src/components/dashboard/ClientDetailPanel.tsx`** -- Add toast feedback to the logo upload mutation's `onSuccess` and `onError` callbacks

