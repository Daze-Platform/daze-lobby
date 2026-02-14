

## Fix: Kanban Card Drag Delay

### Root Cause

The optimistic update is **broken due to a query key mismatch**. Here is the problem:

- The query is registered with key: `["clients-with-details", { includeDeleted: false }]`
- The optimistic update in `onMutate` reads/writes to: `["clients-with-details"]` (missing the second parameter)

Because React Query uses exact key matching for `getQueryData` and `setQueryData`, the optimistic update silently does nothing. The card only moves after the full database round-trip completes (API call, response, refetch), which is why you see the delay.

### Fix

Update `useUpdateClientPhase` in `src/hooks/useClients.ts` to use the correct full query key with `{ includeDeleted: false }`:

1. `cancelQueries` -- use the partial key (this already works since it matches prefixes)
2. `getQueryData` -- change from `["clients-with-details"]` to `["clients-with-details", { includeDeleted: false }]`
3. `setQueryData` in `onMutate` -- same fix
4. `setQueryData` in `onError` rollback -- same fix

### Technical Details

**File: `src/hooks/useClients.ts`** (useUpdateClientPhase mutation)

- Line 136-137: Fix `getQueryData` key to `["clients-with-details", { includeDeleted: false }]`
- Line 139: Fix `setQueryData` key to match
- Line 148: Fix rollback `setQueryData` key in `onError` to match

This is a one-line-per-location fix that will make the card move instantly on drop, before the server responds.

