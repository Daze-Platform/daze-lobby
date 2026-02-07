
# Blocker System Overhaul: Task-Based Blocking

## Overview

This plan redefines the blocker system to be **entirely task-based**, preventing lifecycle phase transitions when onboarding checklist items are incomplete. Blockers will no longer relate to order volume, revenue, or external metrics.

---

## Current State

### Existing Blocker Types (to be replaced)
The current `BlockerResolutionModal` references these `auto_rule` values:
- `low_order_volume` - Revenue metric (not task-related)
- `missing_legal` - Task-related
- `device_offline` - Hardware status (not task-related)
- `stale_onboarding` - Time-based (not task-related)

### Onboarding Tasks (5 steps)
```
1. Legal    → Pilot Agreement signing
2. Brand    → Logo & color palette upload
3. Venue    → F&B outlet configuration
4. POS      → Point-of-sale integration
5. Devices  → Hardware preference selection
```

### Lifecycle Phases
```
Onboarding → Reviewing (In Progress) → Pilot Live → Contracted
```

---

## New Blocker Model

### Core Principle
Blockers are **only** created when a client attempts to move to the next lifecycle phase without completing all required tasks for that phase.

### Task-to-Phase Mapping

| From Phase | To Phase | Required Tasks |
|------------|----------|----------------|
| Onboarding | Reviewing | All 5 tasks (Legal, Brand, Venue, POS, Devices) |
| Reviewing | Pilot Live | All 5 tasks + any review-specific items |
| Pilot Live | Contracted | All above + final sign-off |

---

## Implementation Plan

### Part 1: Update Mock Data (Blockers Page)

**File: `src/pages/Blockers.tsx`**

Replace the current mock data with task-based blockers:

```typescript
const mockBlockers = [
  { 
    id: "1", 
    hotelName: "The Riverside Hotel", 
    reason: "Pilot Agreement not signed - awaiting legal signature",
    incompleteTask: "legal",
    taskName: "Legal & Agreements",
    type: "automatic",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  { 
    id: "2", 
    hotelName: "Mountain View Lodge", 
    reason: "Brand identity incomplete - missing logo upload",
    incompleteTask: "brand",
    taskName: "Brand Identity",
    type: "automatic",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  { 
    id: "3", 
    hotelName: "Lakefront Inn", 
    reason: "POS integration pending - provider not selected",
    incompleteTask: "pos",
    taskName: "POS Integration",
    type: "automatic",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];
```

Add visual indicators showing which task is blocking:
- Task badge with step letter (A, B, C, D, E)
- Direct link to open that task in the portal

---

### Part 2: Update BlockerResolutionModal

**File: `src/components/modals/BlockerResolutionModal.tsx`**

Update the helper functions to reflect task-based blockers:

```typescript
// New auto_rule values (task-based)
const TASK_RULES = {
  incomplete_legal: "Legal Agreement Pending",
  incomplete_brand: "Brand Identity Incomplete",
  incomplete_venue: "Venue Setup Required",
  incomplete_pos: "POS Integration Pending",
  incomplete_devices: "Device Setup Required",
};

function parseIssueTitle(autoRule: string | null, reason: string): string {
  if (autoRule && TASK_RULES[autoRule]) {
    return TASK_RULES[autoRule];
  }
  return reason.split(" ").slice(0, 4).join(" ");
}

function getActionConfig(autoRule: string | null): { label: string; path: string } {
  // All task blockers navigate to the portal
  const actions = {
    incomplete_legal: { label: "Open Pilot Agreement", path: "/portal" },
    incomplete_brand: { label: "Complete Brand Setup", path: "/portal" },
    incomplete_venue: { label: "Configure Venues", path: "/portal" },
    incomplete_pos: { label: "Set Up POS", path: "/portal" },
    incomplete_devices: { label: "Choose Devices", path: "/portal" },
  };
  return actions[autoRule] || { label: "Open Portal", path: "/portal" };
}

function getDazeNote(autoRule: string | null): string {
  const notes = {
    incomplete_legal: "The pilot agreement must be signed before we can proceed to the next phase.",
    incomplete_brand: "Brand assets help us configure the guest-facing experience.",
    incomplete_venue: "Venue details are required for menu and ordering setup.",
    incomplete_pos: "POS integration enables real-time order syncing.",
    incomplete_devices: "Device selection determines hardware requirements for launch.",
  };
  return notes[autoRule] || "Completing this task unlocks the next phase.";
}
```

---

### Part 3: Update Seed Data

**File: `src/hooks/usePurgeAndReseed.ts`**

Replace the current blocker seed with task-based examples:

```typescript
const blockerAlerts = [
  {
    hotel_id: hotelIds.riverside,
    blocker_type: "automatic" as const,
    reason: "Pilot Agreement not signed - client has not completed the legal step",
    auto_rule: "incomplete_legal",
  },
  {
    hotel_id: hotelIds.mountainview,
    blocker_type: "automatic" as const,
    reason: "Brand identity incomplete - no logos uploaded yet",
    auto_rule: "incomplete_brand",
  },
];
```

---

### Part 4: Enhanced Blockers Page UI

**File: `src/pages/Blockers.tsx`**

Add richer UI elements:

1. **Task Badge**: Show which onboarding step is blocking (e.g., "Step A", "Step D")
2. **Progress Indicator**: Show how many tasks are complete (e.g., "2/5 complete")
3. **Quick Action Button**: "Open in Portal" to navigate directly to the client portal
4. **Filter/Sort**: Allow filtering by task type

Visual Layout:
```
┌─────────────────────────────────────────────────────────────────────┐
│  🔴 The Riverside Hotel                              [A] Legal      │
├─────────────────────────────────────────────────────────────────────┤
│  ⚠️  Pilot Agreement not signed - awaiting legal signature         │
│                                                                     │
│  Progress: ░░░░░░░░░░░░░░░░░░░░  0/5 tasks                         │
│                                                                     │
│  Created 2 days ago                        [ Open in Portal ]       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Blockers.tsx` | Replace mock data with task-based blockers, enhance UI |
| `src/components/modals/BlockerResolutionModal.tsx` | Update auto_rule mappings to task-based values |
| `src/hooks/usePurgeAndReseed.ts` | Update seed data with task-based blocker examples |

---

## Technical Notes

### Blocker Auto-Rules (New Values)
```typescript
type TaskBlockerRule = 
  | "incomplete_legal"
  | "incomplete_brand"
  | "incomplete_venue"
  | "incomplete_pos"
  | "incomplete_devices";
```

### Future Consideration: Automatic Blocker Creation
When phase transitions are attempted, the system could automatically:
1. Check if all required tasks are complete
2. If not, create a blocker_alert with the appropriate `auto_rule`
3. Prevent the phase change until resolved

This automation would be implemented via a database trigger or edge function (not included in this plan but noted as a logical next step).

---

## UI Styling

- **Task Badge Colors**: Use the existing step badge styling (A, B, C, D, E indicators)
- **Progress Bar**: Match the portal's Ocean Blue (#0EA5E9) for completed segments
- **Destructive State**: Red/destructive theming for the overall card border (already in place)
- **Hover Effects**: Lift animation on hover, consistent with Daze design system
