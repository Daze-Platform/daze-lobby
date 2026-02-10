

# Sync Portal Preview UI with Portal Page

## Problem

The UI improvements (solid accent border, Target icon, motivational copy, step numbers, waving hand emoji, tasks counter) were applied only to `src/pages/Portal.tsx`. The Portal Preview page (`src/pages/PortalPreview.tsx`) is a separate component that still uses the old styling. Since Portal Preview is meant to maintain 1:1 UI parity with the client portal, it needs the same visual updates.

## Changes

### `src/pages/PortalPreview.tsx`

**Welcome Section (lines 314-325)**
- Change "Welcome Back" label to "Your Portal"
- Add waving hand emoji before the display name
- Tighten spacing (`mb-0.5` instead of `mb-3`, `mb-4 sm:mb-6 lg:mb-10` instead of `mb-8 lg:mb-12`)

**Progress Card (lines 329-366)**
- Add `border-t-2 border-primary shadow-md` to the Card
- Add `Target` icon next to the "Progress" label
- Increase desktop ProgressRing size from 160 to 180
- Add a divider and "Tasks completed" counter between StatusBadge and the demo controls
- Adjust padding for consistency

**Checklist Card (lines 369-391)**
- Add step progress indicators with numbered pills (1-5) in the card header, color-coded by completion status
- Add dynamic motivational micro-copy below the "Setup Tasks" title based on progress percentage
- Add `overflow-hidden` to the card

### No new files or dependencies required

All changes mirror the exact markup and logic already present in `Portal.tsx`.

