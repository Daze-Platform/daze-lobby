

# Add Google OAuth to Partner Portal Login (`/portal/login`)

## Overview

Add Google Sign-In capability to the Partner Portal login page, allowing clients to authenticate using their Google accounts in addition to email/password.

## Current State

- **`/portal/login`** uses `ClientLoginForm.tsx` which only supports email/password authentication
- **`/auth`** uses `LoginForm.tsx` which already has working Google OAuth via `lovable.auth.signInWithOAuth("google")`
- The Lovable Cloud auth integration (`@lovable.dev/cloud-auth-js`) is already configured and provides managed Google OAuth

## Implementation Approach

Follow the existing pattern from `LoginForm.tsx` to add Google OAuth to `ClientLoginForm.tsx`:

### Changes to `ClientLoginForm.tsx`

1. **Add Google loading state**
   ```tsx
   const [googleLoading, setGoogleLoading] = useState(false);
   ```

2. **Import the Lovable auth module**
   ```tsx
   import { lovable } from "@/integrations/lovable";
   ```

3. **Add Google sign-in handler**
   ```tsx
   const handleGoogleSignIn = async () => {
     setGoogleLoading(true);
     setError(null);
     try {
       const { error } = await lovable.auth.signInWithOAuth("google", {
         redirect_uri: window.location.origin,
       });
       if (error) {
         setError(error.message || "Failed to sign in with Google");
         toast({ title: "Google Sign In Failed", ... });
       }
     } catch (err) { ... }
     finally { setGoogleLoading(false); }
   };
   ```

4. **Add UI elements**
   - "Or continue with" divider after the email/password form
   - Google sign-in button with proper styling (accent-colored for Partner Portal branding)

### UI Layout After Changes

```text
┌─────────────────────────────────────────┐
│            [Daze Logo]                  │
│          Partner Portal                 │
│          Welcome back                   │
│    Access your onboarding portal        │
│                                         │
│  Email: [_________________________]     │
│  Password: [___________________] 👁     │
│                                         │
│  [████ Sign In to Portal ████]          │
│                                         │
│  ─────── Or continue with ───────       │
│                                         │
│  [🟡 Sign in with Google]               │  <-- NEW
│                                         │
│  📧 Need help? Contact support          │
└─────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/auth/ClientLoginForm.tsx` | Add Google OAuth button, handler, and loading state |

---

## Technical Details

### Google Button Styling
- Use `variant="outline"` with accent border for Partner Portal branding
- Match the rounded-xl style of other form elements
- Disabled when either email/password or Google sign-in is loading

### Authentication Flow
```text
User clicks "Sign in with Google"
    ↓
lovable.auth.signInWithOAuth("google") is called
    ↓
User is redirected to Google consent screen
    ↓
After consent, redirected back to origin
    ↓
Session is established via Lovable Cloud
    ↓
useAuth hook detects session
    ↓
Redirect to /post-auth
    ↓
PostAuth routes client to /portal
```

### Error Handling
- Display errors in the same Alert component used for email/password errors
- Show toast notifications for failed attempts
- Reset loading state in `finally` block to prevent stuck spinners

---

## Security Considerations

1. **Role assignment**: New Google users will need to have the `client` role assigned in `user_roles` table before they can access the portal (same as email/password users)
2. **No self-signup**: Clients are still invited by admins - Google OAuth just provides an alternative authentication method for existing accounts
3. **Managed credentials**: Uses Lovable Cloud's managed Google OAuth (no API keys needed)

---

## Testing Checklist

After implementation, verify:
- [ ] Google button appears on `/portal/login`
- [ ] Clicking Google button initiates OAuth flow
- [ ] After successful Google auth, user lands on `/portal` (if client role)
- [ ] Error states display correctly if OAuth fails
- [ ] Loading states work correctly (button disabled, spinner shown)
- [ ] Both Google and email/password can be used on the same page without conflicts

