
# Fix "Open in Portal" Button Routing on Blockers Page

## Problem
The "Open in Portal" button on the Blockers page navigates to `/portal` (a generic route) instead of the client-specific admin portal URL `/admin/portal/:slug`. Since admins are viewing this page, it needs to route to the admin portal for the specific client.

## Solution

### 1. `src/hooks/useActiveBlockers.ts` -- Include `client_slug` in the query and type

- Add `clientSlug: string | null` to the `ActiveBlocker` interface
- Update the Supabase query to also select `client_slug` from the joined `clients` table: `.select("id, client_id, reason, blocker_type, auto_rule, created_at, clients(name, client_slug)")`
- Map `clientObj?.client_slug` into the returned `ActiveBlocker` object

### 2. `src/pages/Blockers.tsx` -- Use the slug for navigation

- Change line 206 from `onClick={() => navigate("/portal")}` to `onClick={() => navigate(\`/admin/portal/\${blocker.clientSlug}\`)}`
- Add a guard so the button is disabled if `clientSlug` is null (unlikely but safe)

### Files Modified
- `src/hooks/useActiveBlockers.ts` -- Add `clientSlug` to query and type
- `src/pages/Blockers.tsx` -- Route to `/admin/portal/:slug` using the client's slug
