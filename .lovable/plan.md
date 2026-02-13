

# Fix: Admin Session Hijacks Share Links Meant for Other Users

## Problem

When you copy a share link from Control Tower (e.g., `/portal/daze-beach-resort?email=angelothomas09@gmail.com`) and open it on your phone, the phone's browser already has an active session for `angelo@dazeapp.com` (admin). `PortalRoute` sees `hasDashboardAccess(role) === true` on line 45 and immediately redirects to `/admin/portal/daze-beach-resort`, dropping the `?email=` parameter. The intended recipient never gets the signup/login prompt.

## Fix

### File: `src/components/layout/PortalRoute.tsx`

Before the admin redirect on line 45, check if the URL's `?email=` parameter belongs to a **different user** than the one currently signed in. If so, show a "This link is for someone else" interstitial card with two options:

1. **"Switch Account"** -- Signs out the current admin session and redirects to `/portal/login` with `returnTo` and `email` params preserved, so the intended user can sign up or sign in with the pre-filled email
2. **"Continue as Admin"** -- Proceeds to `/admin/portal/:slug` as it does today

If there is no `?email=` param, or the email matches the signed-in user, behavior remains unchanged (redirect to admin portal).

### Logic Flow

```text
Admin visits /portal/:slug?email=someone@example.com

  Is ?email present?
    No  --> Redirect to /admin/portal/:slug (current behavior)
    Yes --> Does email match current user?
      Yes --> Redirect to /admin/portal/:slug (current behavior)
      No  --> Show interstitial card:
              "This link was created for someone@example.com.
               You're signed in as angelo@dazeapp.com."
              [Switch Account]  [Continue as Admin]
```

### Interstitial Card Design

Reuses the same visual pattern as the existing "Wrong account" card in `AuthRedirect.tsx`:
- Warning icon with heading
- Shows who the link is for and who is currently signed in
- Two side-by-side action buttons

### Technical Details

- Import `useState` from React, `useNavigate` from react-router, `signOut` from `@/lib/auth`, and `Button`/`Card` UI components
- Extract `email` from `new URLSearchParams(window.location.search).get("email")`
- Case-insensitive comparison against `user.email` from `useAuthContext()`
- "Switch Account" calls `signOut()`, then navigates to `/portal/login?returnTo=/portal/:slug&email=...`
- "Continue as Admin" navigates to `/admin/portal/:slug`
- No database or backend changes required
- Only one file modified: `PortalRoute.tsx`
