

## Add Deletion Confirmation Dialogs Across the Control Tower

### Summary
Three admin components currently delete items immediately on click without a confirmation step. This plan adds AlertDialog confirmations to each, matching the existing pattern used throughout the app.

### What Changes

**1. AdminVenuePresets.tsx** -- Venue preset delete button (line 228)
- Add state for `deleteVenueTarget` (stores the venue to delete)
- Wrap the trash button click to set the target instead of calling `deleteVenueMutation.mutate()` directly
- Add an AlertDialog at the bottom: "Remove [venue name]?" with description "This venue preset will be removed from the client's portal."
- On confirm, call `deleteVenueMutation.mutate(deleteVenueTarget.id)`

**2. AdminDocumentUpload.tsx** -- Document delete button (line 224)
- Add state `showDeleteConfirm` (boolean)
- Wrap the trash button click to set `showDeleteConfirm = true` instead of calling `deleteMutation.mutate()` directly
- Add an AlertDialog: "Delete [document name]?" with description "This document will be permanently removed."
- On confirm, call `deleteMutation.mutate()`

**3. DocumentUploadSection.tsx** -- Document table delete button (line 489)
- Add state `deleteDocTarget` (stores the Document to delete)
- Wrap the trash button click to set the target instead of calling `deleteMutation.mutate(doc)` directly
- Add an AlertDialog: "Delete [document name]?" with description "This document will be permanently removed from storage."
- On confirm, call `deleteMutation.mutate(deleteDocTarget)`

### Design Consistency
- All three dialogs will use the existing `AlertDialog` component from `@/components/ui/alert-dialog`
- The confirm button will use destructive styling (`bg-destructive text-destructive-foreground`) matching the existing delete dialogs on the Clients and Devices pages
- Loading spinners will show during pending mutations

