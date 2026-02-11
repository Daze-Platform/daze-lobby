

## Fix: Admin redirect from `/portal/:slug` drops the client slug

### Problem
When an admin visits `/portal/daze-downtown-hotel`, the `PortalRoute` guard on line 46 redirects to `/admin/portal` (without the slug). This lands on the admin portal picker page, which may further redirect to `/dashboard`. The slug is lost.

### Root Cause
`PortalRoute` doesn't have access to the URL params. It hardcodes the redirect to `/admin/portal` instead of `/admin/portal/:clientSlug`.

### Fix
**File: `src/components/layout/PortalRoute.tsx`**
- Import `useLocation` from `react-router-dom`
- Extract the client slug from `location.pathname` (the last segment after `/portal/`)
- Change the admin redirect from `/admin/portal` to `/admin/portal/{slug}` when a slug is present

### Technical Detail
```
// Before (line 46):
return <Navigate to="/admin/portal" replace />;

// After:
const slug = location.pathname.split("/portal/")[1];
return <Navigate to={slug ? `/admin/portal/${slug}` : "/admin/portal"} replace />;
```

This is a one-line fix in a single file. The `PortalBySlug` component already has the correct admin redirect logic (line 80: ``Navigate to={`/admin/portal/${clientSlug}`}``), but it never runs because `PortalRoute` intercepts first.

