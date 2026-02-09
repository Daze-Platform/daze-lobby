

## Problem

Currently, `DedicatedPortalRoute` redirects ALL admin/ops/support users away from every dedicated client portal route to `/portal/admin`. You want an exception: admins should be allowed to access `/portal/daze-beach-resort` (the Daze internal test portal) but still be blocked from other client routes like `/portal/springhill-orange-beach`.

## Approach

Add an **allowlist** of paths that admin users are permitted to access. The guard will check the current path against this list before redirecting.

## Technical Changes

### `src/components/layout/DedicatedPortalRoute.tsx`

1. Define an allowlist of portal paths that admin users can access:
   ```typescript
   const ADMIN_ALLOWED_PORTAL_PATHS = ["/portal/daze-beach-resort"];
   ```

2. Update the admin redirect logic to check the current path against this list:
   ```typescript
   if (hasDashboardAccess(role)) {
     const isAllowed = ADMIN_ALLOWED_PORTAL_PATHS.includes(location.pathname);
     if (!isAllowed) {
       return <Navigate to="/portal/admin" replace />;
     }
   }
   ```

This way:
- Admin on `/portal/daze-beach-resort` --> allowed through, renders the portal
- Admin on `/portal/springhill-orange-beach` --> redirected to `/portal/admin`
- Client users --> unaffected, same behavior as before

### Future extensibility

To allow admins on additional routes later, simply add paths to the `ADMIN_ALLOWED_PORTAL_PATHS` array.

