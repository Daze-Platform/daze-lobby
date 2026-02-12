

# Fix: Perfectly Center Portal Management Tab Triggers

## Problem

The Portal Management sub-tabs (Documents, Brand/POS, Venues) still appear offset within their grid cells. The root cause is that the base `TabsTrigger` component uses `inline-flex`, which prevents the element from fully stretching to fill its grid cell even when `w-full` is applied. The `inline-flex` display mode keeps the element sized to its content rather than its container.

## Solution

Add `flex` alongside `w-full` and `justify-center` to each `TabsTrigger` in the Portal Management panel. The `flex` class overrides the base `inline-flex`, forcing the trigger to behave as a full block-level flex container that fills the grid cell and centers its children.

For consistency, apply the same fix to the parent-level tabs in `ClientDetailPanel.tsx` as well.

## Changes

### `src/components/dashboard/portal-management/PortalManagementPanel.tsx`

Update each `TabsTrigger` className from:
```
className="text-xs gap-1.5 w-full"
```
to:
```
className="text-xs gap-1.5 w-full flex justify-center"
```

### `src/components/dashboard/ClientDetailPanel.tsx`

Apply the same treatment to the 5 parent-level `TabsTrigger` components for visual consistency:
```
className="gap-1.5 text-xs w-full flex justify-center"
```

This ensures both tab bars render identically: triggers stretch to fill their grid column and content is perfectly centered on all screen sizes.

