

## Isolate Client Routes from Control Tower URLs

**Problem:** Several redirect paths can accidentally send client (hotel/restaurant/beach club) users to admin Control Tower URLs like `/auth`, `/dashboard`, or `/`. The Control Tower is exclusively for Daze internal staff. Client users should only ever see `/portal/*` URLs.

---

### Changes

**1. PostAuth -- Track origin context and redirect accordingly**

**File: `src/pages/PostAuth.tsx`**

- Add an `origin` query param alongside `returnTo` (e.g., `?origin=portal`)
- When the user is unauthenticated and `origin=portal` (or `returnTo` starts with `/portal/`), redirect to `/portal/login` instead of `/auth`
- When the user has no role assigned and origin is portal, the sign-out button should redirect to `/portal/login` instead of `/auth`
- When `isClient(role)` is true, never allow `targetPath` to resolve to `/auth` or `/dashboard` -- always go to `/portal`

**2. ClientLoginForm -- Pass origin through the auth flow**

**File: `src/components/auth/ClientLoginForm.tsx`**

- Include `origin=portal` in the `postAuthPath` so PostAuth knows the user came from the client portal
- This ensures PostAuth always redirects back to portal paths for client users

**3. DedicatedPortalRoute -- Pass origin when redirecting to login**

**File: `src/components/layout/DedicatedPortalRoute.tsx`**

- Already passes `returnTo` -- no change needed since PostAuth will detect `/portal/` prefix

**4. PortalRoute -- Never redirect clients to dashboard**

**File: `src/components/layout/PortalRoute.tsx`**

- Line 50: Change the fallback `<Navigate to="/" replace />` to `<Navigate to="/portal/login" replace />` so non-client, non-admin users never land on the dashboard

**5. AuthRedirect -- Preserve returnTo for portal users**

**File: `src/components/layout/AuthRedirect.tsx`**

- When wrapping `/portal/login`, if user is authenticated, redirect to `/post-auth` but preserve the `returnTo` query param so they land back on the correct portal page

---

### Files Modified

- `src/pages/PostAuth.tsx` -- Portal-aware redirects for unauthenticated and no-role states
- `src/components/auth/ClientLoginForm.tsx` -- Add `origin=portal` to post-auth path
- `src/components/layout/PortalRoute.tsx` -- Change fallback from `/` to `/portal/login`
- `src/components/layout/AuthRedirect.tsx` -- Preserve returnTo when redirecting authenticated portal users

