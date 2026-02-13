

# Faster, Smoother Drag-and-Drop with Haptic Feedback

## What Changes

Three improvements to make card transfers feel snappier and more tactile:

1. **Faster drop animation** -- Reduce the `DragOverlay` drop duration from 200ms to 150ms for a crisper settle
2. **Haptic feedback** -- Use the browser Vibration API to provide a subtle buzz on drag start, column hover, and drop. This works on supported mobile devices and is silently ignored on desktop
3. **Smoother card exit/enter transitions** -- Add a quick opacity+scale transition on the source card placeholder so the layout shift feels intentional rather than abrupt

## Technical Details

### 1. `src/components/kanban/KanbanBoard.tsx`

**Drop animation speed** (around line 224):
```
// Before
dropAnimation={{ duration: 200, easing: '...' }}

// After
dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
```

**Haptic on drag start** (inside `handleDragStart`):
```typescript
// Trigger a short vibration pulse when picking up a card
if (navigator.vibrate) navigator.vibrate(15);
```

**Haptic on column change** (inside `handleDragOver`, when `overColumnId` changes to a new valid column):
```typescript
// Light tap when hovering over a new column
if (navigator.vibrate) navigator.vibrate(10);
```

**Haptic on drop** (inside `handleDragEnd`, after a successful phase change):
```typescript
// Confirm vibration on successful drop
if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
```

### 2. `src/components/kanban/HotelCard.tsx`

**Smoother placeholder transition** (on the dragged card's wrapper `div`, around line 79-83):

Replace the instant `opacity: 0` hide with a CSS transition so the card fades out smoothly when picked up:
```typescript
style={{
  opacity: isBeingDragged ? 0 : 1,
  transform: isBeingDragged ? 'scale(0.95)' : 'scale(1)',
  transition: 'opacity 120ms ease, transform 120ms ease',
  pointerEvents: isBeingDragged ? "none" : undefined,
}}
```

### 3. `src/components/kanban/KanbanColumn.tsx`

**Faster column highlight transition** (line 106):
```
// Before
"transition-all duration-200"

// After  
"transition-all duration-150"
```

## Notes

- `navigator.vibrate()` is a no-op on iOS Safari and desktop browsers -- it just returns `false` gracefully, so no feature detection guards are needed beyond the null check
- The easing change to `cubic-bezier(0.25, 1, 0.5, 1)` gives an "ease-out-quint" feel -- fast start, gentle settle
- No new dependencies required

