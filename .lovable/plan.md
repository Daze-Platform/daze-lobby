
# Fix Sidebar Full Height

## Problem
The sidebar is currently using `h-full` which requires its parent container to have an explicit height. The parent div uses `flex-1 flex overflow-hidden`, which grows to fill space but doesn't establish a concrete height that `h-full` can reference.

## Solution
Update the `DashboardLayout.tsx` to ensure the sidebar container properly fills the remaining viewport height after the header. This involves using `h-[calc(100vh-header-height)]` or ensuring the flex container establishes proper height constraints.

## Technical Changes

### File: `src/components/layout/DashboardLayout.tsx`

**Current structure:**
```tsx
<div className="min-h-screen flex flex-col bg-muted/30">
  <DashboardHeader />
  <div className="flex-1 flex overflow-hidden">
    <DashboardSidebar />
    <main>...</main>
  </div>
</div>
```

**Updated structure:**
```tsx
<div className="h-screen flex flex-col bg-muted/30 overflow-hidden">
  <DashboardHeader />
  <div className="flex-1 flex min-h-0">
    <DashboardSidebar />
    <main className="flex-1 overflow-auto">
      {children}
    </main>
  </div>
</div>
```

Key changes:
1. Change `min-h-screen` to `h-screen` - This gives the outer container a fixed height equal to the viewport
2. Add `overflow-hidden` to the outer container - Prevents body scrolling
3. Add `min-h-0` to the flex child - This is a critical CSS fix that allows flex children to shrink below their content size, enabling proper overflow behavior

This ensures the sidebar's `h-full` has a proper height reference and will stretch from the header to the bottom of the viewport.
