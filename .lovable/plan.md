

## Plan: Harden Admin Blocking on Client Portal Routes

### Problem
When an admin is already signed into the Control Tower and navigates to a client portal route like `/portal/springhill-suites-orange-beach`, the system relies on an async `signOut()` call in `PortalRoute` to clear the session. In browsers like Brave with aggressive privacy shields, this async flow may not reliably complete, potentially allowing brief access or redirect loops.

### Solution
Strengthen the blocking at multiple levels to ensure admins can never access `/portal/*` routes, regardless of browser behavior.

### Changes

**1. `src/components/layout/AuthRedirect.tsx`**
- Detect when the current path is `/portal/login` and automatically inject `origin=portal` into the PostAuth redirect query string
- This ensures PostAuth correctly identifies the portal context and shows the rejection card if an admin is already signed in

**2. `src/components/layout/PortalRoute.tsx`**
- Add a secondary session-clearing mechanism: after calling `signOut()`, also explicitly clear `localStorage` keys related to the auth session (e.g., the Supabase auth token key) as a fallback for browsers like Brave where `signOut()` may not fully clear storage
- Ensure the component never renders children until it has confirmed the user is NOT an admin — move the admin check before ANY child rendering logic

**3. `src/pages/PortalBySlug.tsx`**
- Remove the `Navigate to /admin/portal/:slug` redirect for admin users — this is now redundant since `PortalRoute` already blocks admins before this component renders
- Replace it with a hard block (return null) as an additional safety net, so even if `PortalRoute` somehow passes through, the component itself won't render portal content for admins

**4. `src/components/auth/ClientLoginForm.tsx`**
- On mount, before checking for an existing session, also check the current user's role; if admin, call `signOut()` immediately and show the "This portal is for hotel partners only" error instead of auto-redirecting

### Technical Details

The key hardening in `PortalRoute.tsx`:
```text
// After signOut(), forcibly clear Supabase session from localStorage
// This handles Brave and other privacy-focused browsers
const storageKey = `sb-${supabaseProjectId}-auth-token`;
localStorage.removeItem(storageKey);
sessionStorage.removeItem(storageKey);
```

The `AuthRedirect` origin detection:
```text
// If we're on /portal/login, ensure origin=portal is set
const isPortalLogin = window.location.pathname.startsWith("/portal/");
if (isPortalLogin && !origin) qs.set("origin", "portal");
```

### What Won't Change
- The `/admin/portal/:slug` route continues to work normally for admins
- Client users are unaffected by any of these changes
- The overall auth flow (listeners before session check) remains intact

