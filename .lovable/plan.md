
# Add Documents Tab to Portal Preview

The Documents tab navigation was added to the main Portal page but the PortalPreview (demo) page was not updated. We need to integrate the same navigation pattern into PortalPreview.

## What's Happening

- **Portal.tsx** (actual client portal): Has the new `PortalHeader` with Onboarding/Documents tabs
- **PortalPreview.tsx** (demo page): Still uses the old inline header without the tabs

## Files to Modify

### 1. PortalPreview.tsx

Update the preview page to include:
- Import the `PortalHeader` component and `PortalView` type
- Add `activeView` state to track which tab is selected
- Replace the inline header with the `PortalHeader` component
- Conditionally render either the onboarding content or a demo documents view
- Update mobile bottom navigation to include Onboarding/Documents tabs

### 2. Create Demo Documents View

Since this is a preview/demo page without real data, we'll show:
- The same Documents UI structure as `PortalDocuments`
- Hardcoded sample documents for demonstration
- Working download buttons (can show a toast for demo)

## Implementation Details

The header will change from:
```
[Logo] [PREVIEW badge] ... [Reset Tour] [Activity] [Back to Login]
```

To:
```
[Logo] [PREVIEW badge] ... [Onboarding | Documents tabs] [Reset Tour] [Activity] [Back to Login]
```

Since PortalPreview doesn't have a real `clientId` or database access, we'll:
1. Create a simple inline demo documents list with sample data
2. Show the same empty state or sample documents
3. Keep the demo functionality working

## Mobile Navigation Update

Add Onboarding and Documents buttons to the mobile bottom nav, matching the pattern from Portal.tsx.
