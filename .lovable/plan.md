
# Venue Management Enhancement Plan

## ✅ COMPLETED

The venue management system has been refactored from a destructive batch-save pattern to an auto-save individual CRUD pattern.

### Changes Implemented

1. **`src/hooks/useClientPortal.ts`** - Added individual venue mutations:
   - `addVenueMutation` - Creates venue immediately in database
   - `updateVenueMutation` - Updates venue name/menu with debouncing
   - `deleteVenueMutation` - Deletes venue with confirmation
   - `completeVenueStepMutation` - Marks step as done without re-saving

2. **`src/components/portal/VenueManager.tsx`** - Refactored to auto-save:
   - Debounced name updates (600ms)
   - "Complete Step" button instead of "Save All"
   - Shows "Auto-saved" indicator

3. **`src/components/portal/VenueCard.tsx`** - Enhanced UX:
   - Delete confirmation dialog
   - Save indicator while updating
   - Auto-focus on newly added venues
   - Local state synced with server

4. **`src/components/portal/steps/VenueStep.tsx`** - Updated props for new handlers

5. **`src/components/portal/TaskAccordion.tsx`** - Wired new venue handlers

6. **`src/pages/Portal.tsx`** - Removed `localVenues` state, venues now come directly from server

7. **`src/pages/PortalPreview.tsx`** - Updated demo mode to use new handlers

### User Experience Flow

1. User opens "Venue Manager" step
2. Existing venues load from database immediately
3. User clicks "Add Venue" - new row appears, saved to DB instantly
4. As user types venue name, it auto-saves after 600ms pause
5. User can upload menu PDF - uploads immediately
6. User can remove venue - confirmation dialog, then permanent delete
7. User clicks "Complete Step" to mark task done and unlock next step

