

## Fix: Client Portal Session Interfering with Dashboard Navigation

### Root Cause

Both the admin dashboard and client portal share the same authentication session (same domain, same backend). When Brian is logged in as `brian.92rod@hotmail.com` (client role), every admin route (`/dashboard`, `/clients`, `/auth`, etc.) detects his client role and silently redirects him back to his portal. Signing out destroys the shared session, which also ends any dashboard session in another tab.

### What We Can Fix

**Issue 1 -- Silent redirect to portal when visiting admin URLs**

Currently, `RoleBasedRoute` sends client-role users to `/portal/login`, which auto-resolves back to their portal. Instead, we should show an informational screen explaining they're logged into the wrong account and offer clear options.

**Issue 2 -- Shared sign-out**

This is a fundamental limitation of sharing one authentication backend on one domain. Two different accounts cannot maintain independent sessions simultaneously. However, we can make the portal sign-out redirect cleaner so it doesn't interfere with the admin login page state.

### Changes

**1. `src/components/layout/RoleBasedRoute.tsx` -- Show a "wrong account" screen instead of silent redirect**

When a client-role user lands on an admin route, instead of redirecting to `/portal/login` (which bounces them to the portal), render a card explaining the situation with two options:
- "Go to Partner Portal" (navigate to their portal)
- "Switch Account" (sign out and show admin login)

```text
+---------------------------------------------+
|  Wrong account                               |
|                                              |
|  You're signed in as brian.92rod@hotmail.com  |
|  (Partner Portal account).                   |
|                                              |
|  To access the dashboard, sign out and       |
|  use your @dazeapp.com email.                |
|                                              |
|  [Go to Partner Portal]  [Switch Account]    |
+---------------------------------------------+
```

**2. `src/components/layout/AuthRedirect.tsx` -- Skip auto-clean for client users on `/auth`**

Currently, `AuthRedirect` force-cleans the session when a client visits `/auth`. Instead, let the `RoleBasedRoute` screen (or a similar card on `/auth`) inform the user, so they can choose to switch accounts intentionally rather than having their portal session silently destroyed.

### Technical Details

**File: `src/components/layout/RoleBasedRoute.tsx`**
- Import `signOut` from `@/lib/auth`, `Button` and `Card` components
- Replace the `isClient(role)` redirect on line 36-38 with a rendered "wrong account" card
- The "Switch Account" button calls `signOut()` then navigates to `/auth`
- The "Go to Partner Portal" button navigates to `/post-auth`

**File: `src/components/layout/AuthRedirect.tsx`**
- Modify the wrong-role handling for `isAdminLogin && isClient(role)` case
- Instead of calling `forceCleanSession()` automatically, render a card similar to the one in `RoleBasedRoute`, giving the user the choice to switch accounts or go back to their portal
- This prevents the portal session from being silently destroyed just by visiting `/auth`

### What This Does NOT Fix

- **Simultaneous dual login**: Brian cannot be logged into both `brian.92rod@hotmail.com` and `brian@dazeapp.com` at the same time in the same browser. This is a fundamental limitation of single-session authentication on the same domain. He should use an incognito window or different browser for the second account.
- **Shared sign-out**: Signing out will always end the single shared session. The improvement is making it intentional rather than accidental.

### Files Changed
- `src/components/layout/RoleBasedRoute.tsx`
- `src/components/layout/AuthRedirect.tsx`

