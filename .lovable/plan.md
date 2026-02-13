

## Fix: Ensure Edited Data Persists Over Previous Inputs

### Problems Found

**1. POS provider change leaves stale PMS name in database**
When a user selects a provider, types a PMS name, then goes back and picks a different provider, the old PMS name stays in the database. On reload, the old PMS name shows up under the new provider because the merge operation only adds/overwrites keys -- it never removes the old `pms_name`.

**2. Every intermediate save incorrectly marks the task as "completed"**
The `updateTaskMutation` in `useClientPortal.ts` always calls `merge_task_data` with `p_mark_completed: true`. This means:
- The POS debounce auto-save (from the last fix) marks POS as complete every time the user types in the PMS field
- A "Task updated successfully!" toast fires on every keystroke debounce, spamming the user
- The step progress indicator incorrectly shows POS as done before the user clicks "Mark as Sent to IT"

**3. POS "Back to providers" doesn't persist the cleared selection**
Clicking back only clears local state but doesn't update the database. If the user navigates away before picking a new provider, the old selection remains.

### Solution

**File: `src/hooks/useClientPortal.ts`**
- Add an optional `markCompleted` flag to `updateTaskMutation` (default: `false`)
- Only show "Task updated successfully!" toast when the task is actually being marked complete
- This separates "save draft data" from "complete the step"

**File: `src/components/portal/TaskAccordion.tsx`**
- Split POS handling into two paths:
  - `handlePosUpdate`: for intermediate saves (provider select, PMS name debounce) -- passes `markCompleted: false`
  - `handlePosSave` (existing completion handlers): for "Sent to IT" -- passes `markCompleted: true`
- Add a new `onSaveTask` prop (or modify `onTaskUpdate`) that accepts a `markCompleted` option

**File: `src/components/portal/steps/PosStep.tsx`**
- When selecting a new provider, also clear `pms_name` from the persisted data
- When going back to provider list, persist the cleared state to the database
- Remove PMS name from local state when switching providers

### Technical Details

The core change is in `useClientPortal.ts`:

```typescript
// Before: always marks complete
const updateTaskMutation = useMutation({
  mutationFn: async ({ taskKey, data }) => {
    await supabase.rpc("merge_task_data", {
      ...
      p_mark_completed: true,  // BUG: always true
    });
  },
  onSuccess: () => {
    toast.success("Task updated successfully!");  // spams on every debounce
  },
});

// After: caller decides
const updateTaskMutation = useMutation({
  mutationFn: async ({ taskKey, data, markCompleted = false }) => {
    await supabase.rpc("merge_task_data", {
      ...
      p_mark_completed: markCompleted,
    });
  },
  onSuccess: (_data, variables) => {
    if (variables.markCompleted) {
      toast.success("Task updated successfully!");
    }
  },
});
```

In `PosStep.tsx`, the provider select and back handlers will include all relevant fields:

```typescript
// Provider select: clears old PMS name
onUpdate({ provider: providerId, status: "selected", pms_name: "" });

// Back: clears selection in DB
onUpdate({ provider: "", status: "", pms_name: "" });
```

In `TaskAccordion.tsx`, add a `markCompleted` option to `onTaskUpdate`:

```typescript
onTaskUpdate: (taskKey: string, data: Record<string, unknown>, markCompleted?: boolean) => void;
```

Explicit completion actions (Brand Save, POS "Sent to IT", Devices confirm) will pass `markCompleted: true`. All other saves (debounce, provider select) will pass `markCompleted: false` or omit it.

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useClientPortal.ts` | Add `markCompleted` flag to `updateTaskMutation`, suppress toast on draft saves |
| `src/components/portal/TaskAccordion.tsx` | Thread `markCompleted` option through `onTaskUpdate` |
| `src/components/portal/steps/PosStep.tsx` | Clear stale PMS name on provider switch; persist cleared state on "Back" |

