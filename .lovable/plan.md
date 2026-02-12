

# Fix: Portal URL Slug Input Field Visibility

## Problem

When typing a long slug in the "Portal Access" step, the input text gets pushed to the right and becomes invisible. The `/portal/` prefix and the input field compete for space inside a flex container without proper overflow constraints, causing the text cursor to scroll out of view.

## Root Cause

Two issues in the flex layout at line 526-541 of `NewClientModal.tsx`:

1. The `/portal/` prefix div lacks `shrink-0`, so the browser may try to shrink it
2. The `Input` component inherits `w-full` from the shared component but lacks `min-w-0`, which is required for flex children to properly constrain their width and allow text to scroll within the input rather than expanding the container

## Changes

### File: `src/components/modals/NewClientModal.tsx` (lines 526-541)

1. Add `shrink-0` to the `/portal/` prefix div so it never collapses
2. Add `min-w-0` to the `Input` className so it respects the flex container boundaries and keeps typed text visible within the field

**Before:**
```tsx
<div className="flex items-center gap-0">
  <div className="flex items-center h-11 px-3 rounded-l-lg border border-r-0 border-border/50 bg-muted/70 text-sm text-muted-foreground font-mono whitespace-nowrap">
    /portal/
  </div>
  <Input
    ...
    className="h-11 rounded-l-none font-mono"
    ...
  />
</div>
```

**After:**
```tsx
<div className="flex items-center gap-0">
  <div className="flex items-center shrink-0 h-11 px-3 rounded-l-lg border border-r-0 border-border/50 bg-muted/70 text-sm text-muted-foreground font-mono whitespace-nowrap">
    /portal/
  </div>
  <Input
    ...
    className="h-11 min-w-0 rounded-l-none font-mono"
    ...
  />
</div>
```

This is a two-word fix (`shrink-0` and `min-w-0`) that ensures the prefix stays fixed and the input field properly contains its text within the available space.

