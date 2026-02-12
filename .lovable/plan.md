

## Move "Back to Dashboard" Button to Header Bar

Currently, the "Back to Dashboard" action is buried inside the profile dropdown menu. This change moves it to a visible button right next to the "Admin" badge in the header for quicker access.

### Change

**File: `src/components/portal/PortalHeader.tsx`**

1. Add a "Back to Dashboard" button next to the Admin badge (left section of the header), visible only when `isAdminViewing && !isPreview && onBackToDashboard` is true.
2. Remove the "Back to Dashboard" menu item from both the desktop and mobile profile dropdown menus.

The button will use a ghost variant with the ArrowLeft icon and "Dashboard" label, styled consistently with the existing header controls.

