

# Fix Duplicate Blockers and Watchdog Logic

## Problems Found

### 1. Duplicate blockers (critical bug)
The `check_client_inactivity` RPC function checks for existing unresolved blockers by matching `task_id`, but the INSERT never sets the `task_id` column. Since `NULL = NULL` is false in SQL, the duplicate check always passes, creating a new blocker every time the watchdog runs.

### 2. Watchdog fires on brand-new clients
The watchdog treats *all* incomplete tasks as candidates, even for clients who haven't started onboarding yet (0/5 tasks complete). A client created 3 days ago with zero activity shouldn't generate per-task blocker alerts -- they haven't even logged in.

### 3. "Legal Agreement" is misleading
The watchdog doesn't respect task ordering. It flags "Legal Agreement" because that task's `updated_at` hasn't changed since creation, even though Legal is the *last* step and the client hasn't touched *any* steps yet.

## Solution

### Step 1: Clean up existing duplicates (database migration)

Delete the 4 duplicate blocker rows for this client, keeping none (since the client hasn't started onboarding, these blockers are noise).

```sql
DELETE FROM blocker_alerts
WHERE client_id = '53bd0e70-b268-488e-a947-6d520f516f50'
  AND blocker_type = 'automatic'
  AND resolved_at IS NULL;
```

### Step 2: Fix the RPC function (database migration)

Update `check_client_inactivity` with two fixes:

1. **Include `task_id` in the INSERT** so the duplicate check actually works
2. **Skip clients with 0 completed tasks** -- if a client hasn't completed any task, the watchdog shouldn't fire (they may not have logged in yet)

The key changes to the SQL function:
- Add a sub-query filter: only consider tasks belonging to clients that have at least 1 completed task (i.e., the client has actually started onboarding)
- Set `task_id` in the INSERT to the stale task's ID so duplicate detection works

### Files Modified
- **Database migration only** -- one migration with the cleanup DELETE and the updated `CREATE OR REPLACE FUNCTION`

No application code changes needed.
