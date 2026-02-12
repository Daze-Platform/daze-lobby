

# Fix: Preserve Email Parameter Through Portal Auth Redirects

## What's Wrong

When Matt Sutherland visits `/portal/springhill-suites-orange-beach?email=msutherland@vistahost.com`, the `?email=...` query parameter is silently dropped during the authentication redirect. This means:

- He sees a blank login form instead of a pre-filled signup form
- If he types a different email address, his account won't auto-link to Springhill Suites
- He'd land on a "No hotel assigned" error page

## What's Already Confirmed Working

- Client record exists: "Springhill Suites Orange Beach" with correct slug
- Contact record exists: Matt Sutherland (`msutherland@vistahost.com`) marked as primary
- The `handle_new_user` database trigger correctly auto-links users by email match
- The login form already supports email pre-fill and locking when the parameter is present
- PostAuth correctly resolves `returnTo` destinations

## The Fix (2 files, ~6 lines each)

### 1. `src/components/layout/PortalRoute.tsx` (line 33-34)

Preserve query parameters and forward the email explicitly:

```
Before: const currentPath = window.location.pathname;

After:  const currentPath = window.location.pathname + window.location.search;
        const emailParam = new URLSearchParams(window.location.search).get("email");
        const loginUrl = `/portal/login?returnTo=${encodeURIComponent(currentPath)}${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ""}`;
```

### 2. `src/pages/PortalBySlug.tsx` (line 77)

Same pattern -- preserve the full URL in the redirect:

```
Before: encodeURIComponent(location.pathname)

After:  encodeURIComponent(location.pathname + location.search)
        + email param forwarding
```

## Matt's Experience After the Fix

1. Opens the link -- sees the Daze Partner Portal login
2. Email field shows `msutherland@vistahost.com` (locked, cannot change)
3. Form defaults to "Create your account" (signup mode)
4. He enters his name and password, clicks "Create Account"
5. Gets a verification email, clicks the link
6. Returns to the login page with a green "Email verified!" banner and email pre-filled
7. Signs in with his password
8. Auto-linked to Springhill Suites via the database trigger
9. Lands directly on his onboarding portal with all 5 steps ready

## Files Changed

| File | Change |
|------|--------|
| `src/components/layout/PortalRoute.tsx` | Preserve query params + forward email in redirect |
| `src/pages/PortalBySlug.tsx` | Preserve query params + forward email in redirect |

