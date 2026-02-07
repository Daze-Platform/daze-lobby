
# Fix Password Reset Flow

## Problem Identified

The password reset flow isn't working properly because:

1. **Token handling issue**: When you click the reset link in your email, the authentication system redirects you with tokens in the URL. However, the current code only listens for the `PASSWORD_RECOVERY` event *after* checking for `?reset=1`, creating a timing issue where the event might fire before the listener is set up.

2. **Race condition**: The global auth listener in `useAuth.ts` may process the session before the Auth page can detect it's a password recovery flow.

3. **Missing hash fragment detection**: Supabase includes the recovery token in the URL hash (`#access_token=...`), but we're not checking for this.

---

## Solution

### 1. Improve Token Detection in Auth.tsx

Update the Auth page to:
- Check for recovery tokens in the URL hash immediately on mount
- Set the view to `reset-password` before anything else processes
- Handle both the event-based and URL-based detection

### 2. Add Immediate Hash Check

```typescript
useEffect(() => {
  // Check URL hash for recovery token (Supabase adds tokens to hash)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const type = hashParams.get('type');
  
  // If this is a recovery flow, show reset form immediately
  if (type === 'recovery') {
    setView("reset-password");
    return;
  }
  
  // Also check for reset query param as fallback
  const isReset = searchParams.get("reset") === "1";
  if (isReset) {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset-password");
      }
    });
    return () => subscription.unsubscribe();
  }
}, [searchParams]);
```

### 3. Handle Session Exchange Before Showing Form

Ensure the access token from the hash is properly exchanged for a session before showing the reset form, so `updateUser` can work.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Add URL hash parsing for recovery detection, handle session exchange |

---

## Flow After Fix

1. You request password reset → email is sent
2. You click the email link → redirected to `/auth?reset=1#access_token=...&type=recovery`
3. Auth page detects `type=recovery` in hash → immediately shows `ResetPasswordForm`
4. Session is automatically established from the tokens
5. You enter new password → `supabase.auth.updateUser({ password })` succeeds
6. You're redirected to the dashboard

---

## Additional Consideration

The password reset email currently uses your preview URL. When you publish the app, you may want to update the redirect URL in `ForgotPasswordForm.tsx` to use your published domain (`https://daze-onboarding-demo.lovable.app`) for production use.
