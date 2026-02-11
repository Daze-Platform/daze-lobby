
# Fix: Brand Uploads Lost on Save (Data Overwrite Bug)

## Problem
When a user uploads a brand logo or palette document, the file is saved to storage and the path is written to the `onboarding_tasks.data` JSONB field as a top-level key (e.g., `data["logo_propId_dark"] = "path/to/file"`).

However, when the user clicks **"Save Brand Settings"**, `updateTaskMutation` completely **replaces** the `data` field with `{ properties: [...] }`, wiping out all the upload paths. On refresh, the logos and documents are gone.

## Root Cause
`updateTaskMutation` (line 295-303 in `useClientPortal.ts`) writes:
```
data: newData   // replaces everything
```

While `uploadFileMutation` (line 560-563) correctly merges:
```
data: { ...existingData, [fieldName]: filePath }   // preserves existing keys
```

The save and the upload use different mutations with conflicting merge strategies.

## Affected Uploads
- Brand logos (dark, light, icon per property) -- paths lost on save
- Brand palette documents -- paths lost on save
- Venue menus/logos -- NOT affected (use dedicated DB columns)
- Legal signature -- NOT affected (uses separate mutation)

## Fix

### File: `src/hooks/useClientPortal.ts`

**Change `updateTaskMutation`** to merge new data with existing task data instead of replacing it:

```typescript
// Before (line 295-298):
const { error } = await supabase
  .from("onboarding_tasks")
  .update({ 
    data: data as unknown as Record<string, unknown>,
    ...

// After:
const existingTask = tasks?.find(t => t.task_key === taskKey);
const existingData = (existingTask?.data || {}) as Record<string, unknown>;

const { error } = await supabase
  .from("onboarding_tasks")
  .update({ 
    data: { ...existingData, ...data },
    ...
```

This single change ensures that when Brand Settings are saved with `{ properties: [...] }`, the existing `logo_*` and `palette_document_*` keys are preserved in the JSONB field.

## Scope
- **1 file changed**: `src/hooks/useClientPortal.ts` (3-4 lines added in `updateTaskMutation`)
- No database, storage, or schema changes needed
- No new components needed -- all upload and retrieval logic already works correctly
