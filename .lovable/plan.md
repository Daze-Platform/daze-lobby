

## Add Real-Time Venue Sync Between Admin and Client Portal

When an admin creates a venue preset in Portal Management, it currently only appears in the client portal after a manual page refresh. This plan adds real-time sync so changes appear instantly.

### Changes

**1. Database Migration -- Enable Realtime on `venues` table**

Run a migration to add the `venues` table to the Supabase realtime publication:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.venues;
```

**2. `src/hooks/useClientPortal.ts` (~line 52, after the venues query)**

Add a Supabase Realtime subscription that listens for INSERT, UPDATE, and DELETE events on the `venues` table (filtered to the current `client_id`). When any change is detected, invalidate the `["venues", clientId]` query so the UI refreshes automatically.

```ts
// Subscribe to realtime venue changes
useEffect(() => {
  if (!clientId) return;

  const channel = supabase
    .channel(`venues-realtime-${clientId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "venues", filter: `client_id=eq.${clientId}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [clientId, queryClient]);
```

This is placed inside `useClientPortal` so both the admin preview (via `AdminPortalBySlug`) and the client portal benefit from live updates.

### What stays the same
- All existing venue CRUD logic and optimistic updates remain untouched
- The `AdminVenuePresets` component continues writing to the same `venues` table
- No UI component changes needed -- the query invalidation triggers a re-render automatically

