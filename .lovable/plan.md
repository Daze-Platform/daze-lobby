

## Auto-Save POS Provider Selection from Control Tower

### Problem

Currently, when an admin selects a POS provider in the Control Tower's Brand/POS tab, it is only saved to the database when they click the "Save Instructions" button at the bottom. This means:

1. If an admin picks a provider but doesn't click Save, nothing persists
2. The client portal's POS step won't reflect the admin's selection until Save is explicitly clicked

### Solution

Make the POS provider dropdown auto-save immediately when a selection is made, independent of the instructions save button. The client's portal will then show the admin-selected provider as a pre-selection.

### Changes

**File: `src/components/dashboard/portal-management/AdminBrandPosControls.tsx`**

- Add a new `saveProviderMutation` that fires automatically when the POS provider dropdown value changes
- This mutation reads the existing `onboarding_tasks.data` for the `pos` task, then merges `{ provider: selectedValue }` into it (preserving other keys like `admin_instructions`, `status`, etc.)
- The `onValueChange` handler for the Select will call this mutation immediately
- Keep the existing "Save Instructions" button behavior unchanged (it still saves both instructions and provider together)

**File: `src/components/portal/steps/PosStep.tsx`**

- No changes needed -- the PosStep already reads `data?.provider` as `savedProvider` and initializes the dropdown with it (line 203-207)
- When an admin pre-sets the provider, the client will see it pre-selected and jump straight to the instructions view

### Technical Detail

```text
Admin selects "Toast" in Control Tower
  --> saveProviderMutation fires immediately
  --> UPDATE onboarding_tasks SET data = {...existingData, provider: "toast"}
      WHERE client_id = X AND task_key = 'pos'
  --> Invalidates ["onboarding-tasks", clientId] and ["admin-pos-task", clientId] caches

Client opens POS step
  --> Reads data.provider = "toast"
  --> Pre-selects Toast, shows instructions view automatically
```

This is a single-file change adding one auto-save mutation and wiring it to the dropdown's `onValueChange`.

