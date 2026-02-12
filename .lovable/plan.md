

# Fix: Sidebar Collapse State Truly Persisting Across Navigation

## Problem

The previous fix lifted `isCollapsed` state to `DashboardLayout`, but each page (Dashboard, Clients, Blockers, Devices, Revenue) renders its **own instance** of `<DashboardLayout>`. When navigating between routes, React unmounts the entire old page component (including its `DashboardLayout`) and mounts a fresh one -- resetting `isCollapsed` back to `false`.

## Solution

Use React Router's **layout route** pattern so that `DashboardLayout` is rendered **once** as a parent route and stays mounted across all dashboard child routes. The child pages render into an `<Outlet />` instead of wrapping themselves in `<DashboardLayout>`.

## Changes

### 1. `src/components/layout/DashboardLayout.tsx`
- Import `Outlet` from `react-router-dom`
- Remove the `children` prop
- Render `<Outlet />` in place of `{children}`

### 2. `src/App.tsx`
- Import `DashboardLayout` and wrap all admin routes in a parent layout route:

```text
<Route element={<RoleBasedRoute ...><DashboardLayout /></RoleBasedRoute>}>
  <Route path="/" element={<Dashboard />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/clients" element={<Clients />} />
  <Route path="/blockers" element={<Blockers />} />
  <Route path="/devices" element={<Devices />} />
  <Route path="/revenue" element={<Revenue />} />
  <Route path="/admin/portal" element={<PortalAdmin />} />
  <Route path="/admin/portal/:clientSlug" element={<AdminPortalBySlug />} />
</Route>
```

### 3. Remove `<DashboardLayout>` wrapper from each page
Each of these 7 files needs their `<DashboardLayout>` wrapper removed, keeping only the inner content:

- `src/pages/Dashboard.tsx` -- remove `<DashboardLayout>` wrapper, remove import
- `src/pages/Clients.tsx` -- remove `<DashboardLayout>` wrapper, remove import
- `src/pages/Blockers.tsx` -- remove `<DashboardLayout>` wrapper, remove import
- `src/pages/Devices.tsx` -- remove `<DashboardLayout>` wrapper, remove import
- `src/pages/Revenue.tsx` -- remove `<DashboardLayout>` wrapper, remove import
- `src/pages/PortalAdmin.tsx` -- remove `<DashboardLayout>` wrapper if present
- `src/pages/AdminPortalBySlug.tsx` -- remove `<DashboardLayout>` wrapper if present

## Why This Works

With a layout route, `DashboardLayout` is mounted once and React Router swaps only the `<Outlet />` content when the URL changes. The `isCollapsed` state lives in that single persistent component, so it survives all tab/route transitions.

