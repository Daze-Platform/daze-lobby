

## Finalize Auth Segregation Between `/admin/portal` and `/portal`

### Current State (What Already Works)

The route-wrapper layer is correctly segregated:

- `PortalRoute` redirects admin users from `/portal/:slug` to `/admin/portal/:slug`
- `RoleBasedRoute` blocks client users from `/dashboard` and admin routes with a "Wrong account" card
- `AuthRedirect` redirects admin users from `/portal/login` to `/admin/portal`
- `AuthRedirect` shows a "Wrong account" card for client users on `/auth`
- `LoginForm` blocks non-`@dazeapp.com` emails after form submission
- `ClientLoginForm` blocks admin-role users after form submission

### Issues Found

**1. Google OAuth on Portal Login sends clients to the wrong place**

`ClientLoginForm` sets `redirect_uri: window.location.origin` (the site root `/`). After Google OAuth, a client user lands on `/` which is a dashboard route. `RoleBasedRoute` catches them and shows a "Wrong account" card, forcing them to manually click through to their portal.

**Fix:** Change `redirect_uri` to `${window.location.origin}/post-auth?origin=portal` so PostAuth resolves them to their assigned portal automatically.

**2. Google OAuth on Admin Login bypasses the `@dazeapp.com` domain check**

`LoginForm` also sets `redirect_uri: window.location.origin`. After Google OAuth, the user lands on `/` directly, bypassing the `@dazeapp.com` email domain check that exists in the form's `handleSubmit`. A user with a personal Gmail could sign in via Google and briefly reach the dashboard before `RoleBasedRoute` catches their `client` role.

**Fix:** Change `redirect_uri` to `${window.location.origin}/post-auth` so PostAuth becomes the single routing resolver for all auth flows.

**3. PostAuth destroys admin sessions when `origin=portal`**

When an admin arrives at PostAuth with `origin=portal` (e.g., they clicked a portal link that went through the auth flow), PostAuth calls `signOut()` and shows a rejection card. This is inconsistent with the new redirect-based approach — `PortalRoute` and `AuthRedirect` now silently redirect admins to `/admin/portal` without destroying their session.

**Fix:** Instead of signing out and showing the rejection card, redirect to `/admin/portal`. If a `returnTo` parameter contains a slug (e.g., `/portal/daze-downtown-hotel`), extract the slug and redirect to `/admin/portal/daze-downtown-hotel`.

### Technical Details

**File: `src/components/auth/ClientLoginForm.tsx`**
- Line 154: Change `redirect_uri` from `window.location.origin` to `${window.location.origin}/post-auth?origin=portal`
- If `returnTo` is available, append it: `${window.location.origin}/post-auth?origin=portal&returnTo=${encodeURIComponent(returnTo)}`

**File: `src/components/auth/LoginForm.tsx`**
- Line 163: Change `redirect_uri` from `window.location.origin` to `${window.location.origin}/post-auth`

**File: `src/pages/PostAuth.tsx`**
- Lines 57, 93-96, 104-130: Replace the `__portal_blocked__` sign-out flow with a redirect
- When `isPortalOrigin && hasDashboardAccess(role)`:
  - If `returnTo` contains a slug (e.g., `/portal/daze-downtown-hotel`), extract `daze-downtown-hotel` and redirect to `/admin/portal/daze-downtown-hotel`
  - Otherwise, redirect to `/admin/portal`
- Remove the rejection card UI entirely

### What This Does NOT Change

- `PortalRoute.tsx` — already correctly redirects admins to `/admin/portal/:slug`
- `AuthRedirect.tsx` — already correctly handles role conflicts at the route-wrapper level
- `RoleBasedRoute.tsx` — already correctly blocks client users from admin routes
- The `@dazeapp.com` domain restriction on admin form login (form submit guard stays)
- The admin-role block on portal form login (form submit guard stays)
- Database triggers for auto-role assignment

### Files Changed
- `src/components/auth/ClientLoginForm.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/pages/PostAuth.tsx`
