

# Fix: Allow Admins to View Slug-Based Client Portals

## Problem

When an admin clicks "View portal" on a client card, the app navigates to `/portal/springhill-suites-orange-beach`. The `PortalBySlug` wrapper correctly resolves the slug and renders `<Portal />`. However, `Portal.tsx` itself has an admin guard at line 114-117 that redirects any admin user to `/portal/admin` -- so the admin gets bounced away before ever seeing the portal.

## Solution

The fix is simple: `Portal.tsx` should skip its admin redirect when the portal is being rendered in the context of a slug-based route (i.e., the admin intentionally navigated to a specific client's portal).

### Option: Use the URL to detect slug context

Check `useLocation()` -- if the current path matches `/portal/:slug` (anything beyond `/portal`), skip the admin redirect. This requires no prop drilling or context changes.

### Changes

**`src/pages/Portal.tsx` (lines ~114-117)**

Replace the unconditional admin redirect:
```typescript
if (isAdmin) {
  return <Navigate to="/portal/admin" replace />;
}
```

With a conditional check that only redirects when on the bare `/portal` path:
```typescript
const location = useLocation();
const isSlugRoute = location.pathname !== "/portal" && location.pathname.startsWith("/portal/") && !location.pathname.startsWith("/portal/admin") && !location.pathname.startsWith("/portal/login");

if (isAdmin && !isSlugRoute) {
  return <Navigate to="/portal/admin" replace />;
}
```

This way:
- Admins on `/portal` still get redirected to `/portal/admin` (existing behavior)
- Admins on `/portal/springhill-suites-orange-beach` see the actual portal (new behavior)

Only one file changes, and no new dependencies are needed.

