
# Assign Admin Role and Remove Warning Banner

## 1. Insert Admin Role for Your User

Add a row to the `user_roles` table assigning you the `admin` role.

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('460eb073-a755-4bc0-b4d8-4711eb580160', 'admin');
```

## 2. Remove the Warning Banner

Update the Dashboard component to remove the "No role assigned" warning card entirely. This was a temporary development aid that's no longer needed.

**File:** `src/pages/Dashboard.tsx`
- Remove lines 50-65 (the warning card component)

## After Implementation

Once complete:
- Refresh the page to see your admin role applied
- The warning banner will no longer appear
- You'll have full access to manage hotels and the Kanban board
