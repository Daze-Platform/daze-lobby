

# Client Status Approval Workflow

## Overview

Implement a proper review-and-approval workflow where clients cannot change their own status. When a client completes all onboarding tasks, they transition to "Reviewing" status. The Daze admin team then reviews their submissions and can approve them through the Control Tower, which moves them to "Live".

## Current State Analysis

| Component | Current Behavior |
|-----------|-----------------|
| `PortalPreview.tsx` | Has "Demo: Toggle Status" buttons for testing - **appropriate for demo** |
| `Portal.tsx` | No toggle buttons - status is read-only from database - **already correct** |
| `useClientPortal.ts` | Auto-transitions to `pilot_live` when all tasks complete - **needs change** |
| `KanbanBoard.tsx` | Admins can drag cards between phases - **already works for approval** |

## Proposed Changes

### 1. Modify Auto-Transition Logic

**File:** `src/hooks/useClientPortal.ts`

Change the auto-transition when all tasks complete from `pilot_live` to `reviewing`:

```typescript
// Line 546-556: Change target phase
const updateClientPhaseMutation = useMutation({
  mutationFn: async () => {
    const { error } = await supabase
      .from("clients")
      .update({
        phase: "reviewing" as const,  // Changed from "pilot_live"
        phase_started_at: new Date().toISOString(),
      })
      .eq("id", clientId);
    // ...
  },
  // Update activity log to reflect "reviewing"
});
```

### 2. Add "Reviewing" Column to Kanban Board

**File:** `src/components/kanban/KanbanBoard.tsx`

The `lifecycle_phase` enum already includes `reviewing`, but it's not shown as a column. Update COLUMNS array to include it:

```typescript
const COLUMNS = [
  { phase: "onboarding", title: "Onboarding", subtitle: "Setup & data collection" },
  { phase: "reviewing", title: "In Review", subtitle: "Pending approval" },  // Add this
  { phase: "pilot_live", title: "Pilot Live", subtitle: "Testing & adoption" },
  { phase: "contracted", title: "Contracted", subtitle: "Revenue generation" },
];
```

### 3. Update Portal Preview Demo Toggle (Optional Clarification)

**File:** `src/pages/PortalPreview.tsx`

The demo toggle is intentional for testing. Add clearer labeling that this is admin/demo functionality only. The real Portal.tsx already has no toggle buttons.

### 4. Update ProgressRing Message for "Reviewing"

**File:** `src/components/portal/ProgressRing.tsx`

Already shows "In Review" when `isReviewing` is true (line 187) - no changes needed.

### 5. Update StatusBadge

**File:** `src/components/portal/StatusBadge.tsx`

Already configured for `reviewing` status with "In Review" label - no changes needed.

## Workflow After Implementation

```text
                    CLIENT ACTIONS                          ADMIN ACTIONS
                          │                                       │
                          ▼                                       │
    ┌─────────────────────────────────────┐                      │
    │           ONBOARDING                │                      │
    │     (Client completes tasks)        │                      │
    └─────────────────────────────────────┘                      │
                          │                                       │
                          │ All 5 tasks complete                  │
                          │ (automatic transition)                │
                          ▼                                       │
    ┌─────────────────────────────────────┐                      │
    │           REVIEWING                 │                      │
    │     "In Review" badge shown         │◄─────────────────────┤
    │     Client waits for approval       │                      │
    └─────────────────────────────────────┘                      │
                          │                                       │
                          │              Admin reviews & approves │
                          │              (drag card on Kanban)    │
                          ▼                                       ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                      PILOT LIVE                              │
    │         "Live" badge with emerald glow + confetti            │
    └─────────────────────────────────────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useClientPortal.ts` | Change auto-transition target from `pilot_live` to `reviewing` |
| `src/components/kanban/KanbanBoard.tsx` | Add "Reviewing" column between Onboarding and Pilot Live |
| `src/components/kanban/KanbanColumn.tsx` | Styling already exists for `reviewing` phase |

## Client Portal Experience

1. Client sees status badge showing "Onboarding" while completing tasks
2. Progress ring shows percentage and "Ready for Takeoff" message
3. When all tasks are complete:
   - Status automatically changes to "In Review"
   - Progress ring shows "In Review" text
   - Badge shows "In Review" with outline style
4. Client cannot change status themselves - they wait for admin approval
5. When admin approves (drags card to Pilot Live):
   - Status changes to "Live"
   - Confetti celebration triggers
   - Badge shows emerald "Live" with glow animation
   - Progress ring shows rocket icon and "Launched" text

## Admin Control Tower Experience

1. New column "In Review" appears between "Onboarding" and "Pilot Live"
2. When a client completes all tasks, their card automatically moves to "In Review"
3. Admin reviews submitted documents, logos, agreements in HotelDetailPanel
4. Admin drags card from "In Review" to "Pilot Live" to approve
5. Client portal immediately reflects the status change via real-time sync

## Technical Details

### Database Schema
The `lifecycle_phase` enum already includes `reviewing`:
```sql
lifecycle_phase: "onboarding" | "reviewing" | "pilot_live" | "contracted"
```

### Real-time Sync
Status changes sync automatically because:
- Admin drag-and-drop calls `useUpdateClientPhase` which updates `clients.phase`
- Client portal's `useClientPortal` derives `status` from `client.phase` via memoized computation
- React Query cache invalidation triggers re-render with new status

