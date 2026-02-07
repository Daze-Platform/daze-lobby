
# Kanban Drag-and-Drop Positioning Fix

## Problem Analysis

After examining the code, I identified several issues causing the cards to appear improperly positioned during drag:

1. **Transform Conflict**: The `HotelCard` component applies BOTH dnd-kit's `CSS.Transform` AND Framer Motion's `layout`/`layoutId` props simultaneously, causing conflicting transform calculations
2. **Ghost Card Visibility**: When dragging, the original card reduces to 0.4 opacity and scales to 0.98, but the transform is still being applied - making it look like two cards are moving
3. **Missing Cursor Positioning**: The `DragOverlay` uses default positioning which can cause offset issues, especially in scrollable containers

## Solution Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    BEFORE (Current)                         │
├─────────────────────────────────────────────────────────────┤
│  Original Card (motion.div)                                 │
│  ├── dnd-kit transform (CSS.Transform)                      │
│  ├── Framer Motion layout + layoutId                        │ ← Conflict!
│  └── Framer Motion animate (opacity: 0.4, scale: 0.98)      │
│                                                             │
│  DragOverlay                                                │
│  └── HotelCardOverlay (motion.div with lift effects)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     AFTER (Fixed)                           │
├─────────────────────────────────────────────────────────────┤
│  Original Card (motion.div)                                 │
│  ├── NO dnd-kit transform when dragging                     │
│  ├── Framer Motion layout only (no layoutId)                │ ← No conflict
│  └── visibility: hidden OR opacity: 0 when dragging         │
│                                                             │
│  DragOverlay                                                │
│  └── HotelCardOverlay (pure clone, no motion conflicts)     │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### 1. Fix HotelCard Transform Logic

**File**: `src/components/kanban/HotelCard.tsx`

- When the card is being dragged (`isBeingDragged = true`), **skip applying the dnd-kit transform** since the `DragOverlay` handles the visual drag
- Remove `layoutId` to prevent Framer Motion from trying to animate the card during drag handoff
- Keep `layout="position"` for smooth reordering animations ONLY
- Change the dragging state to use `visibility: hidden` or `opacity: 0` to completely hide the source card (instead of 0.4 opacity which causes visual confusion)

### 2. Simplify DragOverlay Configuration

**File**: `src/components/kanban/KanbanBoard.tsx`

- Remove the custom `dropAnimation` configuration that may be causing timing issues
- Use the default `DragOverlay` behavior for more predictable positioning
- Ensure the overlay matches the exact styling of the card without extra transforms

### 3. Clean Up HotelCardOverlay

**File**: `src/components/kanban/HotelCard.tsx`

- Remove the `motion.div` wrapper with `initial`/`animate` that adds extra scale/rotation
- Render the overlay as a static, lifted card (using CSS only for the shadow/scale)
- This prevents "double animation" from both dnd-kit and Framer Motion

### 4. Improve Ghost Placeholder Behavior

**File**: `src/components/kanban/KanbanColumn.tsx`

- Adjust the ghost placeholder to appear at the TOP of the target column by default
- Ensure smooth space allocation with `layout="position"` on sibling cards

---

## Technical Details

### Key Code Changes

**HotelCard.tsx - Transform handling:**
```typescript
// BEFORE: Always applies transform
const style = {
  transform: CSS.Transform.toString(transform),
  transition,
};

// AFTER: Skip transform when dragging (overlay handles it)
const style = isBeingDragged 
  ? { opacity: 0 }  // Hidden - overlay is the visual representation
  : {
      transform: CSS.Transform.toString(transform),
      transition,
    };
```

**HotelCard.tsx - Remove layoutId conflict:**
```typescript
// BEFORE
<motion.div
  layout
  layoutId={hotel.id}  // Causes conflict with DragOverlay
  ...
>

// AFTER
<motion.div
  layout="position"  // Only animate position changes, not handoff
  ...
>
```

**HotelCardOverlay - Static lift effect:**
```typescript
// BEFORE: Animated lift
<motion.div
  initial={{ scale: 1, rotate: 0 }}
  animate={{ scale: 1.05, rotate: 1.5, ... }}
>

// AFTER: Static CSS-based lift
<div 
  className="transform scale-105 rotate-1 shadow-2xl ..."
  style={{ transform: 'scale(1.05) rotate(1.5deg)' }}
>
```

**KanbanBoard.tsx - Simpler DragOverlay:**
```typescript
// BEFORE: Custom drop animation
<DragOverlay dropAnimation={{
  duration: 200,
  easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
}}>

// AFTER: Default or null for instant snap
<DragOverlay dropAnimation={null}>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/kanban/HotelCard.tsx` | Fix transform logic, remove layoutId, simplify overlay |
| `src/components/kanban/KanbanBoard.tsx` | Simplify DragOverlay configuration |
| `src/components/kanban/KanbanColumn.tsx` | Minor adjustments to layout animation props |

---

## Expected Outcome

After these changes:
- Cards will smoothly follow the cursor when grabbed
- No visual "jumping" or offset issues
- The source card becomes invisible while its overlay floats
- Drop animation snaps cleanly into place
- Sibling cards smoothly make room for the dropped card
