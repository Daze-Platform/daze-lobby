

# Add Logo Edit Button to Client Detail Panel

## Overview
Add a pencil icon overlay on the client's avatar in the detail panel header. Clicking it opens a file picker so admins can upload a new logo. The uploaded logo is already reflected on the kanban board since `HotelCard` reads `logo_url` from the same query cache.

## Changes

### `src/components/dashboard/ClientDetailPanel.tsx`

1. **Add a hidden file input** (`useRef<HTMLInputElement>`) and a logo upload mutation (reusing the same pattern from `AdminBrandPosControls` -- upload to `onboarding-assets` storage, update `clients.logo_url`, invalidate `clients-with-details` query).

2. **Wrap the existing Avatar (lines 262-267)** in a `relative` container and overlay a small pencil edit button on hover:

```text
  +------------------+
  |  [Avatar]        |
  |        [Pencil]  |  <-- bottom-right corner, appears on hover
  +------------------+
```

- The pencil button is a small circular icon button (absolute positioned, bottom-right of the avatar).
- Clicking it triggers `logoInputRef.current?.click()` to open the native file picker.
- On file selection, upload to `onboarding-assets/brands/{clientId}/`, get the public URL, update `clients.logo_url`, and invalidate the `clients-with-details` query.
- Show a loading spinner on the pencil button while uploading.

3. **Imports to add**: `Loader2`, `Upload` from lucide-react; `useMutation`, `useQueryClient` from tanstack; `useRef` from react; `supabase` client (already imported indirectly through hooks).

### No other files need changes
- `HotelCard.tsx` already renders `hotel.logo_url` via `AvatarImage` -- the kanban board will automatically reflect the new logo once the query cache is invalidated.

## Technical Details

- Storage path: `brands/{clientId}/admin-logo-{uuid}.{ext}`
- Storage bucket: `onboarding-assets` (already exists and used by `AdminBrandPosControls`)
- DB update: `UPDATE clients SET logo_url = {publicUrl} WHERE id = {clientId}`
- Query invalidation: `["clients-with-details"]` to refresh both the detail panel and kanban board
- File accept filter: `image/*`

