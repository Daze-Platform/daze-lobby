
## Fix: File Persistence Race Condition in Client Portal

### Root Cause

Two independent mutations both modify `onboarding_tasks.data` using a **read-modify-write** pattern:

1. **uploadFileMutation** -- uploads file to storage, reads task data, merges file path, writes back
2. **updateTaskMutation** -- reads task data, merges form data, writes back (also marks task complete)

When these overlap (e.g., user uploads a logo then quickly clicks "Save Brand Settings"), the second mutation reads stale data (before the first mutation's write) and overwrites it. The last writer wins, losing the file reference.

The same risk exists for logo removal and document removal, which also use the read-modify-write pattern.

### Solution: Atomic JSONB Merge via Database Function

Replace the client-side read-modify-write with a single atomic database operation that merges JSONB at the Postgres level using the `||` operator and `-` operator for key removal.

### Technical Changes

#### 1. New Database Function (SQL Migration)

Create `merge_task_data` RPC that atomically:
- Merges new keys into existing JSONB data (`||` operator)
- Removes specified keys (`-` operator for deletions)
- Optionally marks the task as completed

```sql
CREATE OR REPLACE FUNCTION public.merge_task_data(
  p_client_id uuid,
  p_task_key text,
  p_merge_data jsonb,
  p_remove_keys text[] DEFAULT '{}',
  p_mark_completed boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE onboarding_tasks
  SET
    data = (COALESCE(data, '{}'::jsonb) || p_merge_data) - p_remove_keys,
    is_completed = CASE WHEN p_mark_completed THEN true ELSE is_completed END,
    completed_at = CASE WHEN p_mark_completed THEN now() ELSE completed_at END,
    completed_by_id = CASE WHEN p_mark_completed THEN auth.uid() ELSE completed_by_id END
  WHERE client_id = p_client_id AND task_key = p_task_key;
END;
$$;
```

#### 2. Update `useClientPortal.ts` -- `uploadFileMutation`

Replace the fetch-then-update with a single RPC call:

```typescript
// Before (race-prone):
const { data: freshTask } = await supabase.from("onboarding_tasks").select("data")...
await supabase.from("onboarding_tasks").update({ data: { ...existingData, [fieldName]: filePath } })...

// After (atomic):
await supabase.rpc("merge_task_data", {
  p_client_id: clientId,
  p_task_key: taskKey,
  p_merge_data: { [fieldName]: filePath, [`${fieldName}_filename`]: file.name },
});
```

#### 3. Update `useClientPortal.ts` -- `uploadLogoMutation`

Same atomic merge pattern for logo uploads:

```typescript
await supabase.rpc("merge_task_data", {
  p_client_id: clientId,
  p_task_key: "brand",
  p_merge_data: {
    logos: { ...existingLogos, [variant]: publicUrl },
    logoFilenames: { ...existingFilenames, [variant]: file.name },
  },
});
```

Note: The `logos` sub-object still needs a read-before-write since JSONB `||` only does shallow merge. However, since `uploadLogoMutation` is the only writer of the `logos` key, this is safe.

#### 4. Update `useClientPortal.ts` -- `updateTaskMutation`

Use atomic merge with the `p_mark_completed` flag:

```typescript
await supabase.rpc("merge_task_data", {
  p_client_id: clientId,
  p_task_key: taskKey,
  p_merge_data: data,
  p_mark_completed: true,
});
```

#### 5. Update `TaskAccordion.tsx` -- `handleLogoRemove` and `handleDocumentRemove`

Use the `p_remove_keys` parameter for atomic key deletion:

```typescript
// Logo remove
await supabase.rpc("merge_task_data", {
  p_client_id: clientId,
  p_task_key: "brand",
  p_merge_data: { logos: updatedLogos, logoFilenames: updatedFilenames },
  p_remove_keys: [topLevelKey, `${topLevelKey}_filename`],
});
```

This requires refactoring `handleLogoRemove` and `handleDocumentRemove` to call the RPC directly (or exposing a new mutation from `useClientPortal`), rather than calling `onTaskUpdate` which currently does a full data replacement.

#### 6. Update `Portal.tsx` -- `handleSaveLegalDraft`

Replace fetch-then-update with atomic merge for legal draft saves:

```typescript
await supabase.rpc("merge_task_data", {
  p_client_id: clientId,
  p_task_key: "legal",
  p_merge_data: draftData,
});
```

### Files Changed

| File | Change |
|------|--------|
| New SQL migration | Create `merge_task_data` RPC function |
| `src/hooks/useClientPortal.ts` | Replace read-modify-write with `rpc("merge_task_data")` in `uploadFileMutation`, `uploadLogoMutation`, and `updateTaskMutation` |
| `src/components/portal/TaskAccordion.tsx` | Update `handleLogoRemove` and `handleDocumentRemove` to use atomic key removal |
| `src/pages/Portal.tsx` | Update `handleSaveLegalDraft` to use atomic merge |

### What This Fixes

- Logo uploads no longer lost when user saves brand settings quickly after upload
- Document uploads persist regardless of concurrent form saves
- Key deletions (logo/document remove) don't accidentally restore deleted data
- Legal draft saves don't overwrite signature data from concurrent operations
