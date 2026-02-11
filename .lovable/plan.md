

## Refine Auth Routing and Permission Logic

### Problem Summary

The routing/permission system has grown organically and now has overlapping guards that can race against each other, creating unpredictable behavior for a user like Brian who operates both as admin (`brian@dazeapp.com`) and client (`brian.92rod@hotmail.com`).

**Current issues:**
- `LoginForm` and `ClientLoginForm` contain their own session-detection `useEffect` hooks that can fire before `AuthRedirect` (the wrapper) has a chance to show the "wrong account" card or handle role conflicts
- `PortalRoute` silently destroys admin sessions if Brian accidentally visits a portal URL while logged into the dashboard
- Role checks are duplicated in `LoginForm` (domain check), `ClientLoginForm` (role check), `AuthRedirect` (role-aware card), `RoleBasedRoute` (role-aware card), and `PortalRoute` (auto-clean)

### Design Principle

**Guards live in route wrappers, not in form components.** Login forms should only handle form submission. All session detection, role checking, and redirect logic belongs in `AuthRedirect`, `RoleBasedRoute`, and `PortalRoute`.

### Changes

#### 1. `src/components/auth/LoginForm.tsx` -- Remove redundant session/auth redirects

**Remove** the two `useEffect` hooks that check for existing sessions and redirect:
- Lines 64-87: `useEffect` that calls `getSession()` on mount and navigates to `/post-auth`
- Lines 99-105: `useEffect` that watches `isAuthenticated` and navigates to `/post-auth`

These are redundant because `AuthRedirect` (which wraps the `/auth` route) already handles authenticated users before `LoginForm` ever renders. The form should only handle its own submit flow.

Also **remove** the pre-submit session check (lines 133-145) inside `handleSubmit` -- by the time the form renders, `AuthRedirect` has already confirmed the user is not authenticated.

Keep the `@dazeapp.com` domain check after `signIn()` -- this is a submit-time guard, not a session-detection guard.

#### 2. `src/components/auth/ClientLoginForm.tsx` -- Remove redundant auth redirect

**Remove** the `useEffect` (lines 77-82) that watches `isAuthenticated` and navigates to `postAuthPath`. `AuthRedirect` handles this before the form renders.

Also **remove** the pre-submit session check (lines 111-117) inside `handleSubmit`.

Keep the admin-role check after `signIn()` (lines 122-137) -- this is a submit-time guard.

#### 3. `src/components/layout/PortalRoute.tsx` -- Show choice card instead of silent session destruction

Replace the silent `forceCleanSession()` for admin users with a "Wrong account" card (same pattern as `RoleBasedRoute`). This prevents Brian's admin session from being destroyed if he accidentally navigates to a `/portal/*` URL.

The card will show:
- "You're signed in as brian@dazeapp.com (Dashboard account)"
- Two buttons: "Go to Dashboard" and "Switch to Portal Account" (which signs out and redirects to `/portal/login`)

#### 4. `src/components/layout/AuthRedirect.tsx` -- Minor cleanup

The current logic is mostly correct. One small fix: when a **client user** visits `/portal/login` (already authenticated as client), the redirect to `/post-auth?origin=portal` is correct. No changes needed here beyond ensuring consistency with the form-level cleanup.

### Technical Details

**File: `src/components/auth/LoginForm.tsx`**
- Remove `useEffect` for `checkExistingSession` (lines 64-87)
- Remove `useEffect` for `isAuthenticated` redirect (lines 99-105)
- Remove `navigationAttemptedRef` usage throughout
- Remove pre-submit `getSession()` check in `handleSubmit` (lines 133-145)
- After successful `signIn()`, navigate to `/post-auth` directly (keep the `@dazeapp.com` check before navigating)

**File: `src/components/auth/ClientLoginForm.tsx`**
- Remove `useEffect` for `isAuthenticated` redirect (lines 77-82)
- Remove `navigationAttemptedRef` usage throughout
- Remove pre-submit `getSession()` check in `handleSubmit` (lines 111-117)
- After successful `signIn()` + role check, navigate to `postAuthPath` directly

**File: `src/components/layout/PortalRoute.tsx`**
- Remove the `useEffect` that calls `forceCleanSession()` for admin users (lines 30-37)
- Remove `signingOut` state
- Replace the admin-user block (lines 62-69 loader) with a "Wrong account" card UI
- Card buttons: "Go to Dashboard" (navigates to `/dashboard`) and "Switch to Portal Account" (calls `signOut()` then navigates to `/portal/login`)

### What This Does NOT Change
- `PostAuth.tsx` -- remains the central routing resolver after authentication
- `RoleBasedRoute.tsx` -- already has the correct "wrong account" card for client users on admin routes
- `AuthRedirect.tsx` -- already correctly handles role conflicts at the route-wrapper level
- The `@dazeapp.com` domain restriction on admin login
- The admin-role block on portal login
- The database trigger that auto-assigns roles based on email domain

### Files Changed
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/ClientLoginForm.tsx`
- `src/components/layout/PortalRoute.tsx`

