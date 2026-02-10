
# Restructure Portal Routing: Dedicated Admin and Client Paths

## Summary

Reorganize routing so that:
- **Clients** access their portal at `/portal/:clientSlug` (e.g., `/portal/springhill-suites-orange-beach`)
- **Admins** access client portals at `/admin/portal/:clientSlug` (e.g., `/admin/portal/springhill-suites-orange-beach`)
- The only UI difference is admins see the location (client) dropdown in the header; clients do not
- Remove the old `/portal/admin` picker page and `/portal` base route for clients

## Route Changes

| Route | Who | Purpose |
|-------|-----|---------|
| `/portal/:clientSlug` | Client users | Client's own portal (no switcher) |
| `/admin/portal` | Admin users | Client picker (no client selected yet) |
| `/admin/portal/:clientSlug` | Admin users | View specific client portal (with switcher) |
| `/portal/login` | All | Client login page (unchanged) |

## File Changes

### 1. `src/App.tsx`
- Replace `/portal/admin` route with `/admin/portal` (client picker)
- Add `/admin/portal/:clientSlug` route using `RoleBasedRoute` wrapping a new `AdminPortalBySlug` component (or reuse `PortalBySlug` with admin awareness)
- Keep `/portal/:clientSlug` for client access (wrap with `PortalRoute` to enforce client-only access)
- Remove the bare `/portal` route (clients now use `/portal/:clientSlug`)

### 2. `src/pages/PortalAdmin.tsx`
- Update the "Back to Dashboard" and navigation references from `/portal/admin` to `/admin/portal`
- When a client is selected from the picker, navigate to `/admin/portal/:clientSlug` instead of rendering Portal inline
- This makes the URL reflect which client the admin is viewing

### 3. Create `src/pages/AdminPortalBySlug.tsx`
- Similar to `PortalBySlug` but for admins
- Resolves slug, sets `selectedClientId` in context, renders `<Portal />`
- No auth redirect to `/portal/login` -- admins use `/auth`

### 4. `src/pages/Portal.tsx`
- Remove the admin redirect guard entirely (routing now handles separation)
- The `Portal` component becomes a pure view -- it renders the portal UI regardless of role
- The `PortalHeader` receives `isAdmin` / `isAdminViewing` props based on role context, which controls whether the client switcher dropdown is shown

### 5. `src/pages/PortalBySlug.tsx`
- Add a role check: if the user is an admin, redirect them to `/admin/portal/:clientSlug` so they land on the correct route
- If the user is a client, verify they are assigned to the client matching that slug (security)

### 6. `src/components/layout/PortalRoute.tsx`
- Update the admin redirect from `/portal/admin` to `/admin/portal`

### 7. `src/components/portal/AdminClientSwitcher.tsx`
- When a client is selected, use `navigate()` to go to `/admin/portal/:clientSlug` instead of just setting the context state
- This requires looking up the slug for the selected client (add `client_slug` to the query)

### 8. Update navigation references across the codebase
- Any "View portal" buttons on client cards that currently link to `/portal/:slug` should link to `/admin/portal/:slug` when used by admins
- The "Back to Dashboard" button in the header dropdown should still navigate to `/dashboard`
- `PostAuth.tsx` and `RoleBasedRoute.tsx`: update any `/portal/admin` references to `/admin/portal`

## Technical Details

### Security
- `/portal/:clientSlug` enforced by `PortalRoute` -- only authenticated client users whose `user_clients` record matches the slug
- `/admin/portal/*` enforced by `RoleBasedRoute` with `allowedRoles={["admin", "ops_manager", "support"]}`

### Client Switcher Behavior
- In `AdminClientSwitcher`, selecting a client navigates to `/admin/portal/{slug}` rather than just setting state
- The `client_slug` field needs to be included in the admin clients query

### Portal Component
- `Portal.tsx` checks `hasDashboardAccess(role)` to determine whether to show the switcher in the header
- No redirect logic inside Portal -- routing guards handle access control completely
