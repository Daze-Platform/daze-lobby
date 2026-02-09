
# Remove Purge & Reseed Feature

## Overview
Remove the "Purge & Reseed Data" section from the Settings dialog and delete the associated hook file, since the app is going live and this development utility is no longer needed.

## Changes

### 1. Delete `src/hooks/usePurgeAndReseed.ts`
Remove the entire file.

### 2. Update `src/components/settings/SettingsDialog.tsx`
- Remove the import of `usePurgeAndReseed`
- Remove the `showPurgeConfirm` state
- Remove the `handlePurgeAndReseed` function
- Remove the entire "Data Management (Test Only)" section (the `{isTest && isAdmin && (...)}` block with the Purge button)
- Remove the `AlertDialog` confirmation modal for purge
- Clean up any unused imports that were only used by this section (e.g., `Database`, `Trash`, `Warning` from Phosphor icons, `AlertDialog` components -- only if not used elsewhere in the file)
