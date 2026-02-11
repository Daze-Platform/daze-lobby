

## Fix Auth Conflicts Between Admin and Client Users on Same Browser

### Root Cause

When two users share the same browser (or one user has both admin and client accounts), stale sessions from the other role prevent access to the correct login page. The `AuthRedirect` component blindly redirects any authenticated user away from login pages without checking if they belong on that login page.

### Problem Breakdown

1. **Admin can't reach /auth**: If a client session lingers, `AuthRedirect` sees `isAuthenticated=true` and redirects to `/post-auth`, which resolves to the client portal. The admin never sees the login form.

2. **Client can't reach /portal/login**: If an admin session lingers, both `ClientLoginForm` (mount effect) and `PortalRoute` (guard) race to sign out the admin, causing flicker, double sign-outs, and sometimes a stuck state on Brave.

3. **Brave storage issues**: `signOut()` may not fully clear `localStorage`/`sessionStorage` auth tokens in privacy-focused browsers, leaving ghost sessions.

### Fix 1: Make AuthRedirect role-aware

**File: `src/components/layout/AuthRedirect.tsx`**

Instead of redirecting all authenticated users, check their role:
- On `/auth` (admin login): if the user is a **client**, sign them out and show the login form instead of redirecting
- On `/portal/login` (client login): if the user is an **admin**, sign them out and show the login form instead of redirecting
- If the role matches the login page context, redirect to `/post-auth` as before

This eliminates the "can't reach login form" problem entirely.

### Fix 2: Remove redundant admin sign-out from ClientLoginForm mount

**File: `src/components/auth/ClientLoginForm.tsx`**

Remove the `checkExistingSession` effect (lines 66-101) that signs out admin users on mount. This is now handled by `AuthRedirect` before the form even renders, eliminating the race condition with `PortalRoute`.

### Fix 3: Consolidate Brave storage cleanup into a shared utility

**File: `src/lib/auth.ts`**

Add a `forceCleanSession()` helper that:
1. Calls `supabase.auth.signOut()`
2. Explicitly removes the `sb-{projectId}-auth-token` key from both `localStorage` and `sessionStorage`

Use this in `AuthRedirect` when signing out a mismatched role user, and in `PortalRoute` for admin rejection. This replaces the scattered inline storage cleanup code.

### Fix 4: Simplify PortalRoute admin handling

**File: `src/components/layout/PortalRoute.tsx`**

Replace the `useEffect`-based admin sign-out with a call to the new `forceCleanSession()` utility, and redirect to `/portal/login` after cleanup completes. Remove the duplicated inline `localStorage`/`sessionStorage` removal code.

### Technical Flow After Fix

```text
Admin Brian visits /auth with stale client session:
  AuthRedirect detects: authenticated + client role + on /auth
    -> forceCleanSession()
    -> renders <Auth /> login form (no redirect)
    -> Admin Brian logs in fresh

Client Brian visits /portal/login with stale admin session:
  AuthRedirect detects: authenticated + admin role + on /portal/login
    -> forceCleanSession()
    -> renders <PortalLogin /> form (no redirect)
    -> Client Brian logs in fresh
```

### Files Changed

- `src/lib/auth.ts` -- add `forceCleanSession()` utility
- `src/components/layout/AuthRedirect.tsx` -- role-aware redirect logic with session cleanup
- `src/components/auth/ClientLoginForm.tsx` -- remove redundant admin session check on mount
- `src/components/layout/PortalRoute.tsx` -- use shared cleanup utility, simplify admin guard

