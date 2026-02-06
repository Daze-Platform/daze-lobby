

# Disable Row Level Security on Specifications Table

Execute the requested SQL to allow n8n full access to the specifications table.

---

## SQL to Execute

```sql
ALTER TABLE specifications DISABLE ROW LEVEL SECURITY;
```

---

## Security Impact

| Before | After |
|--------|-------|
| INSERT: Public | All operations: Public |
| SELECT: Dashboard users only | All operations: Public |
| UPDATE: Admins only | All operations: Public |
| DELETE: Admins only | All operations: Public |

**Warning**: Disabling RLS completely removes all access control. Anyone with the anon key can read, insert, update, or delete any specification.

---

## Alternative (Recommended)

If you only need INSERT to work, the current policy should already allow that. The issue might be:
1. The migration hasn't deployed yet
2. There's a different error occurring

If you still want to proceed with disabling RLS entirely, approve this plan and I'll execute the migration immediately.

---

## After Implementation

Once executed, retry your n8n upload and I'll read the specification to build the Kanban Lifecycle View.

