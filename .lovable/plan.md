

## Fix: Exclude Deleted Clients from Sidebar Count

### Problem
The "Clients" badge in the admin sidebar counts all clients, including soft-deleted ones. It should only count active clients (where `deleted_at` is null).

### File Changed

| File | Change |
|------|--------|
| `src/components/layout/DashboardSidebar.tsx` | Add `.is("deleted_at", null)` filter to the clients count query |

### Detail

In `DashboardSidebar.tsx` (around line 50), the `clients-count` query currently does:

```typescript
const { count, error } = await supabase
  .from("clients")
  .select("*", { count: "exact", head: true });
```

Add one line to filter out deleted clients:

```typescript
const { count, error } = await supabase
  .from("clients")
  .select("*", { count: "exact", head: true })
  .is("deleted_at", null);
```

This aligns the sidebar badge with the active clients list, which already applies this same filter in the `useClients` hook.

