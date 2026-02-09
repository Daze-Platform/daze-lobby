

# URL Routing Refinement: Separate Admin Portal View from Client Portal

## Problem Statement

Currently, both admin users and client users access the portal at the same URL (`/portal`). While the code correctly shows different interfaces based on role (admins see the hotel switcher, clients see only their property), sharing the same URL creates potential confusion:

1. **URL semantics**: An admin viewing at `/portal` could be confusing since it's the same URL clients use
2. **Accidental exposure risk**: If routing logic ever fails, clients could theoretically see admin UI elements
3. **Deep linking complexity**: When sharing URLs or debugging, there's no clear distinction in the URL path

## Proposed Solution

Introduce a dedicated admin route (`/portal/admin`) for Control Tower users to view client portals, while keeping `/portal` exclusively for actual clients.

## Route Structure After Changes

```text
/portal           → Client-only portal (clean, no switcher)
/portal/admin     → Admin portal viewer (with hotel switcher)
/portal/login     → Client login page (no change)
/portal-preview   → Public demo (no change)
```

---

## Technical Implementation

### 1. Create Admin Portal Viewer Route

**New File:** `src/pages/PortalAdmin.tsx`

A dedicated page for admins to view client portals with the hotel switcher. This component will:
- Require admin/ops_manager/support role
- Show the `AdminHotelSwitcher` prominently
- Display the selected client's portal in the same UI as current
- Redirect non-admin users to `/portal`

### 2. Update `/portal` Route to be Client-Only

**Modify:** `src/pages/Portal.tsx`

- Remove the admin-specific UI elements (AdminHotelSwitcher, "ADMIN" badge)
- If an admin accidentally navigates here, redirect them to `/portal/admin`
- Clean, focused experience for clients only

### 3. Update Routing in App.tsx

**Modify:** `src/App.tsx`

```text
/portal       → PortalRoute (clients only) → Portal
/portal/admin → RoleBasedRoute (admin roles) → PortalAdmin
```

### 4. Update PortalRoute Guard

**Modify:** `src/components/layout/PortalRoute.tsx`

- Add logic to redirect admin users from `/portal` to `/portal/admin`
- Keep existing client access validation

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/PortalAdmin.tsx` | Create | Admin-only portal viewer with hotel switcher |
| `src/pages/Portal.tsx` | Modify | Remove admin UI, make client-only |
| `src/components/layout/PortalRoute.tsx` | Modify | Redirect admins to `/portal/admin` |
| `src/App.tsx` | Modify | Add `/portal/admin` route |
| `src/components/portal/PortalHeader.tsx` | Modify | Remove admin-specific props for client view |
| `src/pages/PostAuth.tsx` | Modify | Update admin redirect to `/portal/admin` if they were intended for portal |

---

## Detailed Component Changes

### PortalAdmin.tsx (New File)

```text
Structure:
- Uses all existing admin logic from Portal.tsx
- Always shows AdminHotelSwitcher
- Shows "Control Tower Portal View" branding
- Reuses existing TaskAccordion, ProgressRing, etc.
- Has "Back to Dashboard" link
```

### Portal.tsx Changes

```text
Before:
- Checks isAdmin and shows AdminHotelSwitcher
- Shows "ADMIN" badge when isAdminViewing

After:
- Redirect if isAdmin → /portal/admin
- No AdminHotelSwitcher
- No admin badge
- Clean client-only experience
```

### PortalRoute.tsx Changes

```text
Before:
if (!isClient(role) && !isAdmin) → redirect to /

After:
if (isAdmin) → redirect to /portal/admin
if (!isClient(role)) → redirect to /
```

---

## Security Considerations

1. **No new RLS changes needed** - Data access is already controlled via existing policies
2. **Route guards remain strict** - Admin route requires admin roles, client route requires client role
3. **Clean separation** - Each interface has its own dedicated URL path

---

## User Experience Flow

**For Clients:**
```text
Login at /portal/login
    ↓
PostAuth redirects to /portal
    ↓
See clean portal (their property only)
```

**For Admins:**
```text
Login at /auth
    ↓
PostAuth redirects to /dashboard
    ↓
Click "View Portal" for a client (from dashboard)
    ↓
Navigate to /portal/admin
    ↓
Use switcher to select client and debug
```

---

## Alternative Considered

**Keep single `/portal` route, just hide UI better**: This was rejected because:
- URL-based separation is cleaner and more maintainable
- Easier to audit access patterns in logs
- Prevents any accidental UI exposure through timing issues
- Aligns with the "Control Tower vs. Client Portal" architectural split principle

