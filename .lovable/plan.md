

# Fix: Tab Trigger Alignment in Portal Management Grid

## Problem

The active tab trigger inside the Portal Management `TabsList` does not sit centered within its grid cell. The "Documents" active state appears to have uneven padding -- more on some sides than others. This is caused by conflicting sizing: the `TabsList` is `h-9` with `p-1` internal padding, but the `TabsTrigger` uses fixed `py-1.5` and `px-3` instead of stretching to fill the available cell height.

## Root Cause

The `TabsTrigger` in `tabs.tsx` uses `inline-flex` with fixed padding. When placed inside a CSS grid (`grid-cols-3`), the trigger does not stretch vertically to fill the cell. The result is the active background highlight floats inside the cell rather than filling it edge-to-edge (minus the list's `p-1` padding).

## Solution

Update the `TabsTrigger` base styles in `src/components/ui/tabs.tsx` to use `h-full` so triggers always stretch to fill the parent grid/flex cell height. This is a one-line change in the shared component that fixes it everywhere.

## Technical Details

### File: `src/components/ui/tabs.tsx` (line 30)

Add `h-full` to the `TabsTrigger` default className so it stretches vertically within any grid or flex parent.

**Before:**
```
"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ..."
```

**After:**
```
"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium h-full ..."
```

This single addition ensures the trigger fills the grid cell height, and the `p-1` on `TabsList` provides equal padding on all four sides around the active highlight.

No changes needed in `PortalManagementPanel.tsx` -- the fix is at the component library level.

