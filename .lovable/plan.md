# Device Management Enhancement Plan

## ✅ COMPLETED

This plan has been fully implemented.

### Summary of Changes

1. **Database Migration**: Added `is_daze_owned` boolean column to `devices` table (defaults to `true`)

2. **Dashboard Metric**: Changed "Devices Online" to "Devices" - now shows count of Daze-owned tablets only

3. **New Onboarding Step**: Added "Device Setup" task (Step E) after POS Integration where clients choose:
   - "Use Daze Tablets" with quantity selector (1-20)
   - "Use Our Own Devices"

### Files Modified
- `src/pages/Dashboard.tsx` - Updated metric label and value
- `src/hooks/useHotels.ts` - Simplified query to filter `is_daze_owned=true`
- `src/components/portal/TaskAccordion.tsx` - Added DevicesStep, updated TASK_ORDER
- `src/components/portal/steps/index.ts` - Added DevicesStep export
- `src/pages/PortalPreview.tsx` - Added devices task to demo
- `src/components/ui/step-badge.tsx` - Added "E" as valid step
- `src/components/kanban/HotelCard.tsx` - Updated to use `dazeDeviceCount`

### Files Created
- `src/components/portal/steps/DevicesStep.tsx` - New onboarding step component
