

## Add "Forgot Password?" Flow to Client Portal Login

### What Changes

Three files need updating to give portal clients a complete password-reset experience:

1. **`src/components/auth/ClientLoginForm.tsx`** -- Add a "Forgot Password?" link and a built-in forgot-password / reset-password view so clients never leave the portal login page.
2. **`src/components/auth/ResetPasswordForm.tsx`** -- Accept an optional `redirectTo` prop so it redirects portal clients back to `/portal/login` instead of always going to `/`.
3. **`src/pages/PortalLogin.tsx`** -- Detect the `?reset=1` query param and recovery hash tokens, and render the `ResetPasswordForm` instead of `ClientLoginForm` when a client arrives via a reset link.

### How It Works

```
Client clicks "Forgot Password?"
  --> ClientLoginForm switches to "forgot" mode (inline)
  --> Sends reset email with redirect to /portal/login?reset=1
  --> Client clicks email link
  --> PortalLogin detects reset=1 / recovery hash
  --> Shows ResetPasswordForm (with portal branding)
  --> On success, redirects to /portal/login (not /dashboard)
```

### Detailed File Changes

**`src/components/auth/ClientLoginForm.tsx`**

- Add a new `mode` value: `"forgot"` (alongside existing `"login"` | `"signup"`)
- When `mode === "forgot"`, render a simple email input form that calls `supabase.auth.resetPasswordForEmail` with `redirectTo: window.location.origin + "/portal/login?reset=1"`
- Add a "Forgot Password?" text button below the password field (login mode only), which sets mode to `"forgot"`
- Include a "Back to Sign In" link in the forgot view

**`src/components/auth/ResetPasswordForm.tsx`**

- Add an optional `redirectTo?: string` prop (defaults to `"/"`)
- After successful password update, redirect to the provided path instead of always `/`

**`src/pages/PortalLogin.tsx`**

- Import `ResetPasswordForm` and add `useSearchParams`
- Check for `?reset=1` query param or `#type=recovery` hash fragment
- When detected, render `<ResetPasswordForm redirectTo="/portal/login" />` instead of `<ClientLoginForm />`
- Uses the same split-screen layout with `SketchyArtPanel`

