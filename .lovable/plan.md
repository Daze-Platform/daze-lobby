

# Fix: Persist Sidebar Collapsed State Across Navigation

## Problem

The sidebar's collapsed/expanded state is stored as local state inside `DashboardSidebar` (`useState(false)`). When navigating between routes, this state resets, causing the sidebar to reopen after every tab click.

## Solution

Lift the `isCollapsed` state up to `DashboardLayout` so it persists across route changes, and pass it down to `DashboardSidebar` as props.

## Changes

### 1. `src/components/layout/DashboardLayout.tsx`

- Add `isCollapsed` and `setIsCollapsed` state
- Pass `isCollapsed` and `onToggleCollapse` as props to `DashboardSidebar`

### 2. `src/components/layout/DashboardSidebar.tsx`

- Add `isCollapsed` and `onToggleCollapse` to the props interface
- Remove the internal `useState(false)` for `isCollapsed`
- Use the props instead of local state for collapse behavior
- Call `onToggleCollapse` from the toggle button instead of local `setIsCollapsed`

This is a minimal 2-file change. The state now lives in `DashboardLayout`, which stays mounted across all dashboard route transitions, so the collapsed state persists until the user explicitly toggles it.

