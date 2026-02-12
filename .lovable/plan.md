

# Fix: Center Tab Triggers in Portal Management Panel

## Problem

The tab triggers ("Documents", "Brand/POS", "Venues") inside the Portal Management panel appear offset rather than perfectly centered within their grid cells. This is because the `TabsTrigger` base component uses `inline-flex` which doesn't stretch to fill the grid cell, causing content to sit at the start of each column.

## Solution

Add `w-full justify-center` to each `TabsTrigger` so they stretch to fill their grid column and center their content. This ensures perfect alignment on all screen sizes.

## File Changed

**`src/components/dashboard/portal-management/PortalManagementPanel.tsx`** (lines 90-101)

Update each `TabsTrigger` to include `w-full` so they fill their grid cell:

```tsx
<TabsTrigger value="documents" className="text-xs gap-1.5 w-full">
  <FileText className="h-3.5 w-3.5" />
  <span className="hidden sm:inline">Documents</span>
</TabsTrigger>
<TabsTrigger value="brand-pos" className="text-xs gap-1.5 w-full">
  <Palette className="h-3.5 w-3.5" />
  <span className="hidden sm:inline">Brand/POS</span>
</TabsTrigger>
<TabsTrigger value="venues" className="text-xs gap-1.5 w-full">
  <MapPin className="h-3.5 w-3.5" />
  <span className="hidden sm:inline">Venues</span>
</TabsTrigger>
```

This is a single-line-per-trigger change that ensures each trigger fills its grid column and centers its icon + label content uniformly across all breakpoints.

