

## Fix: Persist POS Provider and PMS Name Inputs

### Problem
When a client selects a POS provider and types their PMS name, neither value is saved to the database until they click "Mark as Sent to IT." If the user navigates away, collapses the accordion, or refreshes the page, both inputs are lost and must be re-entered.

### Root Cause
- `handleProviderSelect` in PosStep only updates local state -- it never calls `onUpdate` to persist the selection
- The PMS name input only saves on "Mark as Sent to IT" click, not on change
- The `handlePosUpdate` handler in TaskAccordion has a narrow type that excludes `pms_name`

### Solution
1. Save the provider to the database immediately when selected (before animating to instructions)
2. Auto-save the PMS name with a debounce (e.g., 800ms after the user stops typing) so it persists without requiring a button click
3. Fix the type signature in TaskAccordion to pass `pms_name` through

### Technical Changes

**File: `src/components/portal/steps/PosStep.tsx`**
- In `handleProviderSelect`: call `onUpdate({ provider: providerId, status: "selected" })` to persist the selection immediately
- Add a `useEffect` with debounce on `pmsName` state: after 800ms of no typing, call `onUpdate` with the current provider, status, and `pms_name`
- This ensures both values survive page refreshes and accordion collapses

**File: `src/components/portal/TaskAccordion.tsx`**
- Update `handlePosUpdate` type to include the optional `pms_name` field: `(data: { provider: string; status: string; pms_name?: string })`

### What Users Will See
- Select a POS provider -- it saves instantly; reopen the step and the provider is still selected with instructions showing
- Type a PMS name -- it auto-saves after a brief pause; refresh the page and the name is still there
- No change to existing "Mark as Sent to IT" or "IT Verification" flows

| File | Change |
|------|--------|
| `src/components/portal/steps/PosStep.tsx` | Persist provider on select; debounce-save PMS name |
| `src/components/portal/TaskAccordion.tsx` | Fix `handlePosUpdate` type to include `pms_name` |

