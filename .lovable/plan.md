
# Speed Up Portal Share Link Loading

## Problem

When a user clicks a share link (`/portal/{slug}`), they see up to **4 sequential loading spinners** before content appears. Each gate blocks the next in a waterfall:

1. **Auth initialization** (~1-2s) -- `useAuth` calls `getSession()` then `getCurrentUser()` (which makes 2 more DB calls: `user_roles` + `profiles`)
2. **PortalRoute client gate** (~0.5-1s) -- Waits for `ClientContext` to finish querying `user_clients` join before rendering children
3. **PortalBySlug slug resolution** (~0.5s) -- Queries `clients` table by slug (redundant for client-role users since step 2 already resolved their client)
4. **Portal data loading** (~0.5-1s) -- `useClientPortal` fetches tasks, venues, menus, document count

Total perceived delay: **2-4 seconds** of stacked spinners.

## Root Causes

1. **Redundant client gate in PortalRoute**: For slug-based routes (`/portal/:slug`), `PortalRoute` blocks rendering until `ClientContext` finishes its `user_clients` query. But `PortalBySlug` resolves the client independently by slug -- the `ClientContext` result is never used. This adds ~0.5-1s of unnecessary waiting.

2. **Sequential auth profile fetch**: `getCurrentUser()` makes 3 serial DB calls (`getUser`, `user_roles`, `profiles`). These could run in parallel.

3. **No data prefetching**: Once the slug resolves to a `clientId`, we could start fetching portal data (tasks, venues) immediately, but instead we wait for context propagation and component mounting.

## Fixes

### 1. Skip client-loading gate in PortalRoute for slug routes (biggest win)

**File: `src/components/layout/PortalRoute.tsx`**

The `clientLoading` and `clientId` checks (lines 58-69) are only needed for a bare `/portal` route (no slug). For `/portal/:slug`, the slug component handles resolution.

- Detect if the current path matches `/portal/:slug` (has a second path segment)
- If so, skip the `clientLoading` spinner and `clientId` check -- render children immediately after auth/role validation
- This eliminates one full loading spinner from the waterfall

### 2. Parallelize auth profile queries (moderate win)

**File: `src/lib/auth.ts`** -- `getCurrentUser()`

Currently:
```
const user = await getUser();       // call 1
const role = await user_roles...    // call 2 (waits for call 1)
const profile = await profiles...   // call 3 (waits for call 1)
```

Change calls 2 and 3 to run in parallel with `Promise.all`:
```
const user = await getUser();
const [roleData, profileData] = await Promise.all([
  supabase.from("user_roles")...,
  supabase.from("profiles")...,
]);
```

This saves ~200-400ms by overlapping the two DB queries.

### 3. Prefetch portal data during slug resolution (moderate win)

**File: `src/pages/PortalBySlug.tsx`**

Once the slug query resolves a `clientId`, prefetch the portal's core data (tasks, venues) into the React Query cache so `useClientPortal` finds warm cache entries instead of making fresh requests:

- In the `useEffect` that calls `setSelectedClientId`, also call `queryClient.prefetchQuery` for `["onboarding-tasks", clientId]` and `["venues", clientId]`
- This overlaps data fetching with React's re-render cycle, shaving ~300-500ms off the final loading step

### 4. Same fix for AdminPortalBySlug

**File: `src/pages/AdminPortalBySlug.tsx`**

Apply the same prefetch pattern for admin portal slug resolution.

## Expected Result

- Eliminates 1 full loading spinner (PortalRoute client gate)
- Reduces auth init time by ~200-400ms (parallel queries)
- Overlaps portal data loading with context propagation
- Net improvement: **~1-1.5 seconds faster** perceived load time
