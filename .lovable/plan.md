

## Authenticated Dedicated Client Route with Signup + Welcome Tour

**What this solves:** Currently `/portal/springhill-orange-beach` loads without any authentication, meaning anyone can access it. The General Manager needs to sign up, get redirected back to their dedicated portal URL after login, and see the Welcome Tour on their first visit.

---

### Changes Overview

**1. Add a Client Signup/Login Page with `returnTo` support**

- **File: `src/pages/PortalLogin.tsx`** -- Accept a `returnTo` query param and pass it to the login form
- **File: `src/components/auth/ClientLoginForm.tsx`** -- Major updates:
  - Add a signup mode toggle (currently login-only with "contact support" link)
  - Read `returnTo` from URL search params
  - On successful auth, navigate to `/post-auth?returnTo=<encoded_path>` instead of plain `/post-auth`
  - Include full name field, password strength indicator in signup mode
  - Change the "Need help?" link to a "Don't have an account? Sign up" toggle

**2. Update PostAuth to respect `returnTo`**

- **File: `src/pages/PostAuth.tsx`**
  - Read `returnTo` from query params
  - If present and user is authenticated with a valid role, redirect to `returnTo` instead of the default role-based destination
  - Validate `returnTo` starts with `/portal/` to prevent open redirect attacks

**3. Add auth guard to the dedicated client route**

- **File: `src/App.tsx`**
  - Wrap `/portal/springhill-orange-beach` in a new lightweight auth guard that redirects unauthenticated users to `/portal/login?returnTo=/portal/springhill-orange-beach`
  - This is simpler than `PortalRoute` (no client assignment check needed -- the route itself defines the client)

- **New File: `src/components/layout/DedicatedPortalRoute.tsx`**
  - Lightweight auth wrapper: if not authenticated, redirect to `/portal/login?returnTo=<current_path>`
  - If authenticated, render children
  - No role restriction (any authenticated user can view their dedicated portal)

**4. Welcome Tour uses real user ID when authenticated**

- **File: `src/pages/PortalPreview.tsx`**
  - Import `useAuthContext` to get the current user session
  - Pass `user.id` (when authenticated) to `useWelcomeTour()` instead of the hardcoded `"preview-user"`
  - This ensures the tour shows once per real user and persists correctly in localStorage

---

### Auth Flow

```text
User visits /portal/springhill-orange-beach
  --> Not authenticated?
      --> Redirect to /portal/login?returnTo=/portal/springhill-orange-beach
      --> GM signs up (new signup form) or signs in
      --> Navigate to /post-auth?returnTo=/portal/springhill-orange-beach
      --> PostAuth resolves role, redirects to /portal/springhill-orange-beach
  --> Authenticated?
      --> Render PortalPreview with Welcome Tour (first time only, keyed to user ID)
```

### Files Modified

- `src/components/layout/DedicatedPortalRoute.tsx` -- New file, lightweight auth guard with returnTo
- `src/App.tsx` -- Wrap dedicated route with DedicatedPortalRoute
- `src/components/auth/ClientLoginForm.tsx` -- Add signup mode, returnTo support
- `src/pages/PortalLogin.tsx` -- Pass returnTo through
- `src/pages/PostAuth.tsx` -- Read returnTo query param for redirect
- `src/pages/PortalPreview.tsx` -- Use real user ID for Welcome Tour

