
# Architectural Split: Control Tower vs. Client Portal

## Executive Summary

This plan implements a clear separation between the internal "Control Tower" (admin/ops/support) and the "Client Portal" (hotel clients), with a dedicated branded login experience for clients.

---

## Current State Analysis

After reviewing the codebase, the following is already in place:

| Component | Status | Notes |
|-----------|--------|-------|
| Role-based routing | Implemented | `RoleBasedRoute` and `PortalRoute` exist |
| User roles table | Implemented | Separate `user_roles` table with `app_role` enum |
| Client assignment | Implemented | `user_clients` table links users to clients |
| Dashboard layout | Implemented | `DashboardLayout` with sidebar + header |
| PostAuth resolver | Implemented | Routes to `/portal` or `/dashboard` based on role |
| Client context | Implemented | Multi-tenancy via `ClientContext` |

**What's Missing:**
1. A dedicated Client Login page at `/portal/login` with branded aesthetic
2. A reusable `PortalLayout` wrapper component for the client-facing experience
3. Route blocking to prevent clients from accessing `/dashboard`, `/clients`, `/devices`, etc.
4. Automatic client branding (logo/colors) based on URL slug (future enhancement)

---

## Implementation Plan

### Phase 1: Dedicated Client Login Page

**New File:** `src/pages/PortalLogin.tsx`

Create a client-facing login page with the "A brighter day awaits" Daze aesthetic:
- Uses the existing `SketchyArtPanel` artwork
- Simplified form (email + password only, no sign-up link)
- Redirects to `/portal` on success
- Different messaging: "Access your onboarding portal" instead of "Control Tower"
- Separate from admin login at `/auth`

**Route Addition in `App.tsx`:**
```text
/portal/login → PortalLogin (public, AuthRedirect wrapper)
```

### Phase 2: Portal Layout Component

**New File:** `src/components/layout/PortalLayout.tsx`

Create a minimalist layout wrapper for client portal pages:
- Header with Daze logo (or client logo if available)
- No sidebar navigation (unlike DashboardLayout)
- Clean, focused onboarding experience
- Mobile-first responsive design
- Consumes `ClientContext` for branding

### Phase 3: Enhanced Route Protection

**Update:** `src/components/layout/PortalRoute.tsx`

Strengthen data isolation:
- Block access if trying to navigate to admin routes
- Verify `client_id` matches on all data fetches (already enforced via RLS)

**Update:** `src/components/layout/RoleBasedRoute.tsx`

Ensure client role users are redirected to `/portal` if they try to access dashboard routes.

### Phase 4: Update Auth Flow

**Update:** `src/pages/Auth.tsx`

- Add query parameter detection for `?portal=1` to show client-focused messaging
- Update login form to conditionally show "Control Tower" vs "Partner Portal" branding

**Update:** `src/components/auth/LoginForm.tsx`

- Accept optional `isPortalLogin` prop
- Change copy from "Control Tower" to "Onboarding Portal" when in portal mode
- Hide "Sign up" link for portal login (clients are invited, not self-registered)

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/PortalLogin.tsx` | Create | Dedicated client login page |
| `src/components/layout/PortalLayout.tsx` | Create | Minimalist client layout wrapper |
| `src/components/auth/ClientLoginForm.tsx` | Create | Client-focused login form |
| `src/App.tsx` | Modify | Add `/portal/login` route |
| `src/pages/Portal.tsx` | Modify | Wrap with `PortalLayout` |
| `src/components/layout/RoleBasedRoute.tsx` | Modify | Strengthen client blocking |

---

## Technical Details

### Client Login Form Component

```text
Interface:
- Simpler than admin login (no sign-up, no Google OAuth initially)
- Different messaging: "Welcome back, Partner"
- Subtitle: "Access your onboarding portal"
- Same auth logic, different UX

Key differences from LoginForm:
- No "Don't have an account? Sign up" link
- "Need help?" → mailto:support@daze.com
- Uses same signIn() function and auth flow
- Redirects to /portal instead of /post-auth (or via post-auth)
```

### Route Structure After Changes

```text
/auth                    → Admin login (Control Tower)
/portal/login           → Client login (Partner Portal)
/post-auth              → Role-based redirect resolver

/dashboard              → Admin/Ops/Support only
/clients                → Admin/Ops/Support only
/blockers               → Admin/Ops/Support only
/devices                → Admin/Ops/Support only

/portal                 → Client role (or admin viewing)
/portal-preview         → Public demo preview
```

### Portal Layout Structure

```text
PortalLayout
├── PortalHeader (already exists, minor updates)
│   ├── Logo (client logo or Daze logo)
│   ├── Navigation tabs (Onboarding | Documents)
│   └── User actions (Activity | Sign Out)
├── Main content area
│   └── {children}
└── Mobile bottom navigation (already in Portal.tsx)
```

---

## Security Considerations

1. **RLS Already Enforces Data Isolation**
   - All tables use `client_id` scoping via RLS policies
   - `can_access_client()` function validates access

2. **Route-Level Protection**
   - `RoleBasedRoute` blocks dashboard access for clients
   - `PortalRoute` blocks portal access for non-clients/non-admins

3. **No New Database Changes Required**
   - Existing `user_roles` and `user_clients` tables are sufficient

---

## Future Enhancements (Not in This Plan)

- Property slug-based URLs (e.g., `/portal/grand-hotel`)
- Dynamic branding from client's `brand_palette` and `logo_url`
- Client-specific custom domains
- Invitation-based sign-up flow for new client users
