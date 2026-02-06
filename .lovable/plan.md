
# Blocker Resolution Modal Implementation

## Overview
Create a high-fidelity modal that surfaces blocker diagnostics when users click on a blocked Kanban card. The modal provides instant visibility into why a hotel is stuck and offers a direct action to resolve the blocker.

---

## Current State Analysis

### Data Structure
The `blocker_alerts` table contains:
- `reason`: Full explanation (e.g., "Low order volume detected - 15 orders in last 7 days")
- `blocker_type`: `manual` | `automatic`
- `auto_rule`: The rule that triggered it (e.g., "low_order_volume")
- `created_at`: When the blocker was created (for calculating days stalled)

### Current Hook
`useHotels` fetches hotels with a `hasBlocker` boolean but doesn't include the actual blocker details. We need to extend this or create a separate query.

---

## Technical Implementation

### 1. New Component: `BlockerResolutionModal.tsx`
**Location:** `src/components/modals/BlockerResolutionModal.tsx`

**Props Interface:**
```tsx
interface BlockerData {
  id: string;
  reason: string;
  blockerType: "manual" | "automatic";
  autoRule: string | null;
  createdAt: string;
  hotelName: string;
  hotelPhase: string;
}

interface BlockerResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocker: BlockerData | null;
}
```

**Visual Design:**
- **Backdrop:** `backdrop-blur-md` + `bg-slate-900/60`
- **Modal:** White background, `rounded-xl`, Sunset Orange top border
- **Animation:** Scale-in with spring bounce (reuse existing `modal-enter` keyframe)

**Header Section:**
- Title: "Blocker Detected: [parsed issue name]"
- Pulsing red `AlertTriangle` icon
- Duration badge: "Stalled for X days"

**Body Section:**
- Issue explanation (the `reason` field)
- "Daze Note" explaining impact
- Primary action button (Ocean Blue) - context-aware text

**Footer:**
- Ocean Blue "View Details" or "Resolve" button
- Ghost "Dismiss" button

### 2. New Hook: `useBlockerDetails`
**Location:** `src/hooks/useBlockerDetails.ts`

Fetches full blocker details for a specific hotel:
```tsx
export function useBlockerDetails(hotelId: string | null) {
  return useQuery({
    queryKey: ["blocker-details", hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocker_alerts")
        .select("*")
        .eq("hotel_id", hotelId)
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
  });
}
```

### 3. Update `HotelCard.tsx`
Add click handler that:
1. Detects clicks on blocked cards
2. Triggers modal open with the hotel's blocker data

**Changes:**
- Add `onClick` prop to the Card component
- Prevent propagation during drag
- Pass blocker modal state up to `KanbanBoard`

### 4. Update `KanbanBoard.tsx`
- Add state for selected blocked hotel
- Add state for modal visibility
- Render `BlockerResolutionModal` with fetched blocker data
- Handle the resolution action (navigation or mutation)

### 5. CSS Additions (`src/index.css`)
Add blocker-specific animations:
```css
@keyframes blocker-pulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% { 
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.animate-blocker-pulse {
  animation: blocker-pulse 2s ease-in-out infinite;
}
```

---

## UI Components Breakdown

### Modal Header
```text
┌─────────────────────────────────────────────────────┐
│ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ 2px Sunset Orange ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │
├─────────────────────────────────────────────────────┤
│  [!]  Blocker Detected: Low Order Volume            │
│  ^^^                                                │
│  Pulsing red icon                                   │
│                                                     │
│  This hotel has been stalled for 14 days            │
└─────────────────────────────────────────────────────┘
```

### Modal Body
```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│  THE ISSUE                                          │
│  ─────────                                          │
│  Low order volume detected - 15 orders in last     │
│  7 days (threshold: 50)                            │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  💡 DAZE NOTE                               │    │
│  │  Resolving this allows the hotel to        │    │
│  │  maintain healthy operational metrics.     │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  [████ View Activity Log ████]   [Dismiss]         │
│       Ocean Blue CTA              Ghost            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Action Button Logic

The primary action button text and behavior is context-aware based on `autoRule`:

| Auto Rule | Button Text | Action |
|-----------|-------------|--------|
| `low_order_volume` | "View Activity Log" | Open hotel detail panel |
| `missing_legal` | "Open Pilot Agreement" | Navigate to portal legal step |
| `device_offline` | "View Device Status" | Open devices section |
| `stale_onboarding` | "Resume Onboarding" | Navigate to portal |
| (fallback) | "View Details" | Open hotel detail panel |

---

## Files to Create
1. `src/components/modals/BlockerResolutionModal.tsx`
2. `src/hooks/useBlockerDetails.ts`

## Files to Modify
1. `src/components/kanban/HotelCard.tsx` - Add click handler
2. `src/components/kanban/KanbanBoard.tsx` - Add modal state and rendering
3. `src/components/kanban/index.ts` - Export new component
4. `src/index.css` - Add blocker pulse animation

---

## Animation Specifications

**Entrance Animation:**
- Duration: 300ms
- Easing: `var(--spring-bounce)`
- Initial state: `scale(0.95) translateY(10px) opacity(0)`
- Final state: `scale(1) translateY(0) opacity(1)`

**Alert Icon Pulse:**
- Duration: 2s infinite
- Scale: 1 to 1.1
- Box-shadow: Expanding red ring that fades

**Backdrop:**
- `bg-slate-900/60`
- `backdrop-blur-md`
- Fade in 200ms

---

## Implementation Order

1. Create `useBlockerDetails` hook for data fetching
2. Create `BlockerResolutionModal` component with all UI elements
3. Add CSS animations for blocker pulse
4. Update `HotelCard` with click handler and pass callback prop
5. Update `KanbanBoard` with modal state and conditional rendering
6. Wire up the action buttons with navigation logic
