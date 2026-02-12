

# Fix: Remove Duplicate Close Icon on Mobile Sidebar

## Problem

The mobile sidebar shows two close (X) icons because:
1. The `SheetContent` component (from shadcn/ui) automatically renders a built-in close button at the top-right corner
2. The `DashboardSidebar` component independently renders its own close button when in mobile mode

## Solution

Remove the custom close button from `DashboardSidebar` since the `SheetContent` already provides one. This is the cleanest fix -- it eliminates the duplicate while preserving the built-in Sheet close behavior.

## File Changed

**`src/components/layout/DashboardSidebar.tsx`**
- Remove the "Mobile close button" block (the `{isMobile && onClose && (...)}` section around lines 120-129) that renders a second X button with a border-bottom divider
- The Sheet's own close button (top-right X from `SheetContent`) will remain as the sole close control

No other files need changes.

