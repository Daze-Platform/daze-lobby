

## Fix Pilot Agreement Data Persistence

Two issues are causing data loss in the Pilot Agreement form:

1. **No draft save** -- Closing the modal without signing discards all entered data. Users must complete the entire form in one session.
2. **Incomplete pre-fill on reopen** -- When reopening the modal (signed or unsigned), only 4 fields load from the client record. The remaining ~12 fields (email, outlets, pricing, POS, dates) stored in the task's JSONB `data` are never passed back to the form.

### Fix 1: Merge task data into `initialLegalEntity`

**File: `src/pages/Portal.tsx`** (and/or `TaskAccordion.tsx`)

Currently `hotelLegalEntity` only passes client-table fields:
```text
hotelLegalEntity={{
  legal_entity_name: client?.legal_entity_name,
  billing_address: client?.billing_address,
  authorized_signer_name: client?.authorized_signer_name,
  authorized_signer_title: client?.authorized_signer_title,
}}
```

Change this to merge the legal task's saved `data` (which already contains all extended fields after a previous sign or draft save):
```text
hotelLegalEntity={{
  ...legalTaskData,  // all saved pilot agreement fields from task JSONB
  legal_entity_name: client?.legal_entity_name || legalTaskData?.legal_entity_name,
  billing_address: client?.billing_address || legalTaskData?.billing_address,
  ...
}}
```

This means extracting the legal task's `data` field and passing it through. The task data already stores `contact_email`, `covered_outlets`, `hardware_option`, `start_date`, `pilot_term_days`, `pricing_model`, `pricing_amount`, `pos_system`, `pos_version`, `pos_api_key`, `pos_contact`, and `dba_name`.

### Fix 2: Add auto-draft save on modal close

**File: `src/components/portal/ReviewSignModal.tsx`**

When the modal closes (unsigned), save the current form state to the legal task's JSONB `data` using a spread-merge so it persists for next open.

**File: `src/pages/Portal.tsx`**

Add a `saveLegalDraft` handler that calls `updateTask` (or a new lightweight mutation) to persist the form fields without marking the task as completed. Pass this as a new prop to `LegalStep` and then to `ReviewSignModal`.

### Fix 3: Wire draft save through LegalStep

**File: `src/components/portal/steps/LegalStep.tsx`**

Accept a new `onDraftSave` prop and pass it to `ReviewSignModal`.

**File: `src/components/portal/ReviewSignModal.tsx`**

Call `onDraftSave(currentEntity)` when the dialog closes and the form is dirty (not yet signed).

### Technical Details

- The `saveLegalDraft` will use a dedicated mutation (or reuse `saveLegalEntityMutation`) that updates both the `clients` table (4 core fields) and the `onboarding_tasks` `data` JSONB (all extended fields) without setting `is_completed = true`.
- Uses the existing spread-merge strategy (`{...existingData, ...newData}`) to avoid overwriting signature data if already signed.
- No database schema changes needed -- the task's JSONB `data` column already stores all fields.
- Draft saves happen on modal close only (not on every keystroke) to keep it simple.

