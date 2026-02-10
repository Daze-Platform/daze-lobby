

# Make Admin Portal View Match Client Portal View

## Problem

The `/portal/admin` page has a different visual layout than what clients see on `/portal`. Differences include:
- "Admin View" label instead of "Your Portal"
- Different background color (`bg-muted/30` vs `bg-ambient`)
- Missing the premium progress card styling (no border accent, no task counter, no divider)
- Missing the step progress indicators in the task card header
- Missing the contextual progress message ("You're making great progress", etc.)
- No welcome tour
- Different mobile bottom nav (includes client switcher + dashboard button)

## Solution

Replace the main content area of `PortalAdmin.tsx` with the `Portal` component itself when a client is selected, so admins see the exact same UI. The admin-specific elements (client switcher, back-to-dashboard) will be preserved only in the header and mobile nav — the portal content will be identical.

### Changes

**`src/pages/PortalAdmin.tsx`**

When a client is selected, instead of rendering its own duplicate layout, render the actual `<Portal />` component. This ensures pixel-perfect parity with what clients see.

Key adjustments:
- Once `selectedClientId` is set, render `<Portal />` directly (the same approach `PortalBySlug` uses)
- The slug route detection in `Portal.tsx` already prevents the admin redirect when accessed from a sub-route context; we need to also allow it when the `PortalAdmin` renders it
- Keep the "no client selected" picker screen as-is (it's admin-only and needed)

**`src/pages/Portal.tsx`**

Update the admin redirect guard to also skip when the path is `/portal/admin` (since `PortalAdmin` will now render `Portal` at that path):

```
const isSlugRoute = location.pathname !== "/portal" &&
  location.pathname.startsWith("/portal/") &&
  !location.pathname.startsWith("/portal/login");
```

This removes the `/portal/admin` exclusion so `Portal` renders normally there too.

Update the `PortalHeader` props when an admin is on a slug or admin route:
- Pass `isAdmin={true}` and `isAdminViewing={true}` so the header shows the client switcher and "Back to Dashboard" in the dropdown
- Keep all other portal content (progress card, tasks, welcome section) identical to the client view

**`src/pages/PortalAdmin.tsx` (simplified)**

The selected-client view reduces to:
```
return <Portal />;
```

This mirrors the `PortalBySlug` pattern. The no-client-selected picker screen stays unchanged.

**`src/pages/Portal.tsx` (header props update)**

Detect admin context and pass appropriate header props:
- When admin is on a slug/admin route, show `isAdmin={true}`, `isAdminViewing={true}`, and provide `onBackToDashboard`
- This shows the client switcher in the header and "Back to Dashboard" in the profile dropdown
- All portal content (progress ring, tasks, welcome message) remains the client view

## Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/PortalAdmin.tsx` | Remove duplicate portal layout; render `<Portal />` when client is selected |
| `src/pages/Portal.tsx` | Update admin redirect to allow `/portal/admin`; detect admin context for header props |

