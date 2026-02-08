
## Goal
Make Kanban dragging feel “1:1” with the cursor (no offset), and stop the board from trying to “make space” or behaving unpredictably while a drag is in progress.

## What’s likely causing the “card far from cursor” problem
Your app’s `animate-fade-in-up` utility **uses `transform`** and (critically) uses **animation fill-mode `both`**, which means elements keep a `transform: translateY(0)` after the animation completes.

In CSS, any ancestor with `transform` creates a new containing block, which can break expectations for elements that rely on `position: fixed`. `@dnd-kit/core`’s drag overlay behavior is commonly impacted by this, resulting in the dragged preview appearing offset from the cursor and making drop targeting feel “hard to contain”.

In `src/pages/Dashboard.tsx`, the container that wraps the Kanban board currently uses `animate-fade-in-up`, so the Kanban board lives inside a transformed ancestor.

## Solution overview (high confidence, minimal risk)
We’ll do two complementary fixes that together eliminate offset issues even if future layout animations are added:

1) **Remove transform-based animation from the Kanban wrapper** (keep an entrance animation, but use opacity-only).
2) **Render the DragOverlay in a portal attached to `document.body`**, so it is not affected by transformed ancestors / stacking contexts.

Then, if needed (optional but recommended for your “no space until drop” request), we’ll simplify DnD so columns are the only drop targets and cards don’t participate in “sortable” insertion logic.

---

## Implementation steps

### Step 1 — Stop applying transform animation around the Kanban board
**File:** `src/pages/Dashboard.tsx`

- Change the Kanban section wrapper from `animate-fade-in-up` (transform + opacity) to `animate-fade-in` (opacity only).
- Keep the same delay so the UI still feels polished, but it won’t create a transformed containing block.

**Expected impact**
- Removes the most likely root cause of overlay/cursor misalignment.
- Improves drop containment because what you see (overlay) and what the pointer is doing line up again.

---

### Step 2 — Portal the DragOverlay to `document.body`
**File:** `src/components/kanban/KanbanBoard.tsx`

- Import `createPortal` from `react-dom`.
- Render the `<DragOverlay>` via `createPortal(..., document.body)`.
- Add an explicit high `z-index` wrapper (or style) so the overlay always stays above headers/sidebars.

**Expected impact**
- Even if any parent container has `transform` / `filter` / `backdrop-filter` / etc., the overlay remains aligned to the viewport and stays locked to the cursor.

---

### Step 3 (recommended) — Remove “sortable insertion” behavior entirely (no filling space until drop)
Right now cards are `useSortable` inside a `SortableContext`, which is designed for reordering and can lead to “insertion” behaviors. You’ve already tried freezing transforms, but the underlying sortable system still adds complexity and can feel slippery.

**Files:**
- `src/components/kanban/HotelCard.tsx`
- `src/components/kanban/KanbanColumn.tsx`
- `src/components/kanban/KanbanBoard.tsx`

**Changes**
- Convert cards from `useSortable` to `useDraggable`.
- Remove `SortableContext` from columns.
- Keep `useDroppable({ id: phase })` on columns so **columns are the only droppable targets**.
- Update `handleDragOver` / `handleDragEnd` logic so `over.id` is always a lifecycle phase (simplifies drop rules and makes them more “containable”).

**Why this matches your requirement**
- No reordering math.
- No layout “making space” / insertion point logic.
- Dragging becomes: “pick up card → hover a column → drop → phase updates”.

**Preserved behavior**
- Clicking a card still opens the detail panel.
- Blocked cards remain non-draggable and open blocker modal (with shake feedback).
- Confetti on drop to “contracted” stays.

---

## Validation checklist (what you should feel after)
1) Grab a card from multiple points (top-left, center, bottom-right): the overlay should stay locked to that exact grab point.
2) Drag over columns: the highlight should match exactly where your cursor is.
3) While dragging: other cards should not shift around to create insertion space.
4) Drop behavior: only the intended column should accept the drop (no accidental phase changes).
5) Clicking a card (no drag) still opens the detail panel reliably.

---

## Files that will be changed
- `src/pages/Dashboard.tsx` (switch Kanban wrapper animation to opacity-only)
- `src/components/kanban/KanbanBoard.tsx` (portal DragOverlay; simplify drop logic if Step 3 is approved)
- `src/components/kanban/KanbanColumn.tsx` (remove SortableContext if Step 3 is approved)
- `src/components/kanban/HotelCard.tsx` (switch from useSortable to useDraggable if Step 3 is approved)

---

## Notes / tradeoffs
- The portal + removing transform animation should address the “cursor far from card” issue with very high confidence.
- Moving away from `SortableContext` is the cleanest way to guarantee “no filling space until drop”, since sortable is inherently designed to visualize reordering.
