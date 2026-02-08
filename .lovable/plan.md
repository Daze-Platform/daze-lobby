
# Venue Management Enhancement Plan

## Current State Analysis

The current implementation has several issues that prevent optimal multi-venue management:

1. **Destructive Save Pattern**: The `saveVenuesMutation` deletes ALL venues and re-inserts them on every save, which:
   - Loses the original database IDs (new UUIDs assigned each time)
   - Breaks referential integrity for any future venue-linked data
   - Creates unnecessary database churn

2. **Local State Disconnect**: The Portal page uses `localVenues` state that only syncs FROM the server on initial load, not bidirectionally. This means venues loaded from the database need manual sync.

3. **No Immediate Persistence**: Adding a venue only stores it in local state until "Save Venue Configuration" is clicked, which can lead to data loss if the user navigates away.

4. **File Uploads Not Linked**: Menu PDF uploads happen separately via `uploadVenueMenuMutation`, but since IDs change on every save, the linkage is brittle.

## Proposed Solution

### Architecture Overview

```text
User adds venue
      |
      v
[VenueCard] --> onUpdate --> [VenueManager] --> auto-save individual venue
      |                                                    |
      v                                                    v
Local state updated                             supabase.from("venues").upsert()
      |                                                    |
      v                                                    v
UI reflects change immediately              Database persists permanently
```

### 1. Add Individual Venue CRUD Mutations

**File:** `src/hooks/useClientPortal.ts`

Replace the bulk "delete all + insert all" pattern with granular operations:

```typescript
// Add single venue
const addVenueMutation = useMutation({
  mutationFn: async (venue: { name: string }) => {
    if (!clientId) throw new Error("No client found");
    
    const { data, error } = await supabase
      .from("venues")
      .insert({ client_id: clientId, name: venue.name })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
  },
});

// Update venue (name or menu_pdf_url)
const updateVenueMutation = useMutation({
  mutationFn: async ({ id, updates }: { id: string; updates: Partial<Venue> }) => {
    const { error } = await supabase
      .from("venues")
      .update({ name: updates.name, menu_pdf_url: updates.menuPdfUrl })
      .eq("id", id)
      .eq("client_id", clientId); // Security: ensure client ownership
    
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
  },
});

// Delete single venue
const deleteVenueMutation = useMutation({
  mutationFn: async (venueId: string) => {
    const { error } = await supabase
      .from("venues")
      .delete()
      .eq("id", venueId)
      .eq("client_id", clientId);
    
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
  },
});
```

### 2. Update VenueManager Component

**File:** `src/components/portal/VenueManager.tsx`

Transform from batch-save to auto-save pattern:

- **Add Venue**: Immediately creates in database, then shows in list
- **Update Venue**: Debounced auto-save as user types (500ms delay)
- **Remove Venue**: Confirmation dialog, then permanent delete
- **Save Button**: Changes to "Complete Step" - marks the task complete without re-saving venues

```typescript
interface VenueManagerProps {
  venues: Venue[];
  onAddVenue: () => Promise<Venue>;
  onUpdateVenue: (id: string, updates: Partial<Venue>) => Promise<void>;
  onRemoveVenue: (id: string) => Promise<void>;
  onCompleteStep: () => void;
  isSaving?: boolean;
}

// Debounced name update
const debouncedUpdate = useMemo(
  () => debounce((id: string, name: string) => {
    onUpdateVenue(id, { name });
  }, 500),
  [onUpdateVenue]
);
```

### 3. Improve VenueCard UX

**File:** `src/components/portal/VenueCard.tsx`

- Add visual save indicator (subtle checkmark or spinner while saving)
- Add confirmation dialog for venue deletion ("This will permanently remove this venue")
- Show upload progress for menu PDFs
- Disable delete button while saving

### 4. Update VenueStep to Pass New Props

**File:** `src/components/portal/steps/VenueStep.tsx`

Update props interface to accept the new individual handlers.

### 5. Update TaskAccordion Wiring

**File:** `src/components/portal/TaskAccordion.tsx`

Wire the new handlers from `useClientPortal` to the `VenueStep`.

### 6. Update Portal.tsx

**File:** `src/pages/Portal.tsx`

- Remove `localVenues` state - venues now come directly from the server
- Simplify venue handling since persistence is automatic

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useClientPortal.ts` | Add `addVenue`, `updateVenue`, `deleteVenue` mutations; keep `completeVenueStep` for task marking |
| `src/components/portal/VenueManager.tsx` | Refactor to auto-save pattern with debouncing; change button to "Complete Step" |
| `src/components/portal/VenueCard.tsx` | Add save indicator, delete confirmation, improved upload UX |
| `src/components/portal/steps/VenueStep.tsx` | Update props to pass individual handlers |
| `src/components/portal/TaskAccordion.tsx` | Wire new venue handlers |
| `src/pages/Portal.tsx` | Remove `localVenues` state, simplify venue flow |

## User Experience Flow

1. User opens "Venue Manager" step
2. Existing venues (if any) load from database immediately
3. User clicks "Add Venue" - new row appears with focus on name input
4. As user types venue name, it auto-saves after 500ms pause (with subtle indicator)
5. User can upload menu PDF - uploads immediately with progress indicator
6. User can remove venue - confirmation dialog appears, then deletes permanently
7. When ready, user clicks "Complete Step" to mark the task done and unlock next step

## Technical Benefits

- **Persistence**: Each venue exists in the database the moment it's created
- **No Data Loss**: Users can navigate away without losing venues
- **Better File Linking**: Menu PDFs link to stable venue IDs
- **Cleaner UX**: No "save all" confusion - each action is atomic
- **Activity Logging**: Individual venue actions can be logged separately
