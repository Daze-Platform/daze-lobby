

## Fix: Upload Persistence in Client Portal

### Problem
Uploads (logos, brand documents, venue assets) disappear after page reload because multiple mutations in `useClientPortal.ts` read task data from the **React Query cache** instead of the **database**. When mutations run in quick succession (upload then save), the second mutation overwrites the first mutation's data because the cache hasn't refreshed yet.

### Root Cause
Three mutations use this pattern:
```text
const existingTask = tasks?.find(t => t.task_key === taskKey);  // <-- stale cache!
const existingData = (existingTask?.data || {});
await supabase.from("onboarding_tasks").update({
  data: { ...existingData, ...newData }  // overwrites upload paths
})
```

The `tasks` variable references the React Query cache, which may not reflect recent DB writes from other mutations. This causes a "last write wins" race condition that silently drops upload paths.

### Fix

**File: `src/hooks/useClientPortal.ts`**

Change all three mutations to fetch fresh task data directly from the database before merging:

1. **`updateTaskMutation`** (line ~296): Replace cache lookup with a fresh DB query
2. **`uploadLogoMutation`** (line ~357): Same fix
3. **`uploadFileMutation`** (line ~560): Same fix

The fix replaces:
```text
const existingTask = tasks?.find(t => t.task_key === taskKey);
const existingData = (existingTask?.data || {});
```

With:
```text
const { data: freshTask } = await supabase
  .from("onboarding_tasks")
  .select("data")
  .eq("client_id", clientId)
  .eq("task_key", taskKey)
  .maybeSingle();
const existingData = (freshTask?.data as Record<string, unknown>) || {};
```

This ensures every mutation merges against the latest database state, not a potentially stale cache snapshot.

### Additional Fix: Sanitize File Objects Before Saving

**File: `src/components/portal/TaskAccordion.tsx`** (line ~107)

In `handleBrandSave`, strip non-serializable `File` objects from the `properties` array before sending to the mutation. `File` objects serialize to `{}` in JSON, which pollutes the stored data:

```text
const handleBrandSave = async (data: { properties: PropertyBrand[] }) => {
  // Strip File objects (non-serializable) before saving to DB
  const cleanProperties = data.properties.map(p => ({
    ...p,
    logos: {},  // File objects can't be serialized; URLs are stored separately
  }));
  onTaskUpdate("brand", { properties: cleanProperties });
};
```

### Files to Modify
- `src/hooks/useClientPortal.ts` -- 3 mutations updated to fetch fresh data from DB
- `src/components/portal/TaskAccordion.tsx` -- sanitize brand properties before save

### Result
- All uploads persist correctly across page reloads and sign-out/sign-in
- No race conditions between upload and save mutations
- Works identically on both `/portal` and `/admin/portal` routes

