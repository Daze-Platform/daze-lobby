

## Warning System for Backward Phase Drags on Kanban Board

### Problem
Currently, dragging a client card backward on the Kanban board (e.g., from "Contracted" back to "Pilot Live") executes immediately without any warning. This can lead to accidental regressions in a client's lifecycle status.

### Solution
Add a confirmation dialog that appears when a card is dragged to a phase that is earlier in the lifecycle sequence. The drag will complete visually, but before committing the change, an AlertDialog will ask the admin to confirm the backward move with a clear warning message.

### Phase Order (left to right)
```text
Onboarding (0) -> In Review (1) -> Pilot Live (2) -> Contracted (3)
```

Any move where the target phase index is lower than the current phase index is considered a "backward" move and will trigger the warning.

### Behavior
- **Forward moves** (e.g., Onboarding to In Review): Execute immediately as they do today
- **Same column drops**: Ignored as they are today
- **Backward moves** (e.g., Contracted to Pilot Live): Show a confirmation dialog with the current and target phase names. The user must confirm to proceed, or cancel to revert.

---

### Technical Details

**File: `src/components/kanban/KanbanBoard.tsx`**

1. Create a `PHASE_ORDER` map to assign numeric indices to each phase for comparison:
   ```
   onboarding: 0, reviewing: 1, pilot_live: 2, contracted: 3
   ```

2. Add state for a pending backward move:
   - `pendingBackwardMove: { clientId, clientName, fromPhase, toPhase } | null`
   - `backwardWarningOpen: boolean`

3. Modify `handleDragEnd`:
   - After determining `targetPhase`, compare `PHASE_ORDER[targetPhase]` vs `PHASE_ORDER[activeClientData.phase]`
   - If target index is lower (backward move), store the pending move in state and open the warning dialog instead of calling `updatePhase.mutate()` immediately
   - If target index is higher or equal, proceed as normal

4. Add an `AlertDialog` for the backward move confirmation:
   - Title: "Move client backward?"
   - Description: "You are about to move **{clientName}** from **{fromPhaseLabel}** back to **{toPhaseLabel}**. This is an unusual action. Are you sure?"
   - Cancel button: clears pending state, no mutation
   - Confirm button: executes `updatePhase.mutate()` with the stored pending move data, then clears state

5. Visual feedback during drag: The existing `isOver` highlight on columns will continue to work. No additional visual warning is needed during the drag itself -- the confirmation comes on drop.

### No other files need changes. The warning is fully contained within the KanbanBoard component.

