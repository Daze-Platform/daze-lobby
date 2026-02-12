

# Increase TabsList Height in Portal Management Panel

## Problem
The gray background container holding the Documents / Brand/POS / Venues tab toggles is too short, making the tabs feel cramped without enough vertical padding around them.

## Solution
In `src/components/dashboard/portal-management/PortalManagementPanel.tsx`, increase the TabsList height from `h-9` to `h-11` (44px). This gives the toggle buttons proper vertical breathing room and centers them within the container.

## Technical Details

**File: `src/components/dashboard/portal-management/PortalManagementPanel.tsx`**

- Line ~87: Change `TabsList` class from `h-9` to `h-11`

