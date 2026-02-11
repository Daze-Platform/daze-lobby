

## Fix: Admin Users Can Seamlessly View Client Portal URLs

### The Core Problem

Brian wants to be logged into `brian@dazeapp.com` (admin) in one tab and `brian.92rod@hotmail.com` (client) in another tab, both on `onboarding.dazeapp.com`. **This is technically impossible** — browsers share cookies and storage per domain, so only one authentication session can exist at a time. Signing into one account immediately replaces the other.

### The Right Solution

Brian doesn't actually need two accounts running simultaneously. The platform already has `/admin/portal/:slug` routes that render the **exact same Portal UI** using the admin session. The fix is simple:

**When an admin visits `/portal/daze-downtown-hotel`, automatically redirect them to `/admin/portal/daze-downtown-hotel`.**

This means:
- Brian stays logged in as `brian@dazeapp.com` (admin) everywhere
- Tab 1: `/dashboard` works normally
- Tab 2: `/portal/daze-downtown-hotel` silently becomes `/admin/portal/daze-downtown-hotel` — same portal view, no session conflict
- No "Wrong account" card, no sign-out, no friction

### Changes

**1. `src/components/layout/PortalRoute.tsx` — Redirect admins to `/admin/portal/:slug`**

Replace the "Wrong account" card for admin users with a `Navigate` redirect. Extract the slug from the current URL path and send them to `/admin/portal/:slug`.

- Remove the card UI, `switchingAccount` state, `Button`/`Card`/`AlertTriangle` imports
- Add: parse the slug from `window.location.pathname` and render `<Navigate to="/admin/portal/${slug}" replace />`
- If no slug (bare `/portal`), redirect to `/admin/portal`

**2. `src/components/layout/AuthRedirect.tsx` — Redirect admins on `/portal/login` to `/admin/portal`**

Replace the `forceCleanSession()` auto-clean for admin users visiting `/portal/login` with a redirect to `/admin/portal` (the admin client picker). This prevents their admin session from being destroyed.

- Remove `forceCleanSession` import and the `useEffect` that calls it
- Remove `cleaningSession`, `sessionCleaned` state
- For admin users on portal login, render `<Navigate to="/admin/portal" replace />`

**3. `src/pages/PortalBySlug.tsx` — Remove the admin hard-block**

Remove the `hasDashboardAccess(role)` check (lines 85-87) that returns `null` for admins. This is now unnecessary since `PortalRoute` redirects admins before this component renders.

- Remove `hasDashboardAccess` import

### What This Achieves

- Brian signs in once as admin and can access both `/dashboard` and any `/portal/:slug` URL
- Portal links can be freely shared — admins get redirected to the admin view, clients see the client view
- No session conflicts, no "wrong account" cards on portal routes, no accidental sign-outs
- The "Wrong account" card on admin routes (`RoleBasedRoute`) stays — if a client-role user visits `/dashboard`, they still see the informational card with options

### Files Changed
- `src/components/layout/PortalRoute.tsx`
- `src/components/layout/AuthRedirect.tsx`
- `src/pages/PortalBySlug.tsx`

