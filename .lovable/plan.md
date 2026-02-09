

# Remove "Healthy" Badge from Kanban Cards

## Overview
Remove the "Healthy" status badge from Kanban hotel cards. Only the "Blocked" badge will remain — the absence of a badge implies the client is healthy, reducing visual noise.

## Changes

### `src/components/kanban/HotelCard.tsx`

**In `DraggableHotelCard`** (around the status badge section):
- Remove the entire `else` branch that renders the green "Healthy" pill with the CheckCircle icon
- Keep only the "Blocked" badge when `hotel.hasBlocker` is true

**In `HotelCardOverlay`** (the drag overlay version):
- Same change — remove the "Healthy" branch, keep only the "Blocked" badge

The device count, ARR, and days-in-phase badges remain unchanged.

