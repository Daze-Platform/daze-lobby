

## Block Admin Login on Client Portal

### Problem
Admin users (e.g., `@dazeapp.com` emails) can currently log in through the Client Portal login page (`/portal/login`). After authenticating, they get redirected to `/admin/portal/:slug`, but they should never be allowed to authenticate through the client portal at all.

### Solution
Add a post-login role check in two places to catch admin users and reject them with a clear error message:

### Changes

**1. `src/pages/PostAuth.tsx`** -- Reject admin users who arrived via portal origin

When `isPortalOrigin` is true and the user has dashboard access (admin/ops_manager/support), instead of redirecting to `/dashboard`, sign them out and show an error message telling them to use the admin login at `/auth`.

- In the `targetPath` computation: if `isPortalOrigin && hasDashboardAccess(role)`, return a special sentinel (e.g., `"__portal_blocked__"`)
- In the redirect effect: detect this sentinel, sign the user out, and navigate to `/portal/login` with an error query param
- Alternatively, render an inline error card (similar to the "Account not ready" card) with a message like "This login is for hotel partners only. Please use the admin login." and a button linking to `/auth`

**2. `src/components/auth/ClientLoginForm.tsx`** -- Pre-check after email/password login

After successful `signIn()` call (line 134), before navigating to PostAuth:
- Fetch the user's role from `user_roles` table
- If the role is admin/ops_manager/support, sign them out immediately and show an error: "This portal is for hotel partners only. Please sign in at the admin dashboard."
- This provides instant feedback without the user seeing the PostAuth loading screen

**3. Google OAuth edge case**

For Google sign-in, the redirect goes through PostAuth anyway, so fix number 1 covers this path automatically. No changes needed in the Google OAuth handler.

### Technical Details

In `ClientLoginForm.tsx`, after `signIn()`:
```
// After successful signIn, check role
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", result.user.id)
  .maybeSingle();

const userRole = roleData?.role;
if (userRole === "admin" || userRole === "ops_manager" || userRole === "support") {
  await supabase.auth.signOut();
  setError("This portal is for hotel partners only. Please sign in at the admin dashboard.");
  setLoading(false);
  return;
}
```

In `PostAuth.tsx`, update `targetPath`:
```
// If admin came from portal origin, block them
if (isPortalOrigin && hasDashboardAccess(role)) return "__portal_blocked__";
```

Then render a rejection card when `targetPath === "__portal_blocked__"` with a "Go to Admin Login" button that navigates to `/auth`.

### Files Modified
- `src/components/auth/ClientLoginForm.tsx` -- role check after email/password login
- `src/pages/PostAuth.tsx` -- role check for portal-origin admin users (covers Google OAuth)

