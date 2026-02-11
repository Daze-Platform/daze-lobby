

## Block Client Users from the Control Tower Login

### Problem
The admin login page (`/auth`) currently allows any user to sign in, including client-role users like `brian.92rod@hotmail.com`. The client portal login (`/portal/login`) already blocks admin users, but the reverse guard is missing.

### Solution
Add a role check to `LoginForm.tsx` (the Control Tower login form) that mirrors the existing guard in `ClientLoginForm.tsx`. After a successful email/password sign-in, check the user's role -- if it's `client`, sign them out and show an error message directing them to the Partner Portal.

### Changes

**File: `src/components/auth/LoginForm.tsx`**

After the `signIn()` call succeeds (around line 152), add a role check before proceeding with navigation:

```typescript
// Check if user has a client role -- block them from Control Tower
const userId = result?.user?.id;
if (userId) {
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleData?.role === "client") {
    await supabase.auth.signOut();
    setError("This dashboard is for internal team members only. Please sign in at the Partner Portal.");
    setLoading(false);
    return;
  }
}
```

This is the same pattern already used in `ClientLoginForm.tsx` (lines 121-137) but in reverse -- blocking `client` role instead of blocking `admin`/`ops_manager`/`support` roles.

### What This Does NOT Change
- Google OAuth flow on `/auth`: Already handled by `PostAuth.tsx` and `AuthRedirect.tsx` which detect role mismatches
- The `/portal/login` page: Already has the reverse guard blocking admins
- Brian can still use `brian@dazeapp.com` (admin role) to access the Control Tower
- Brian can still use `brian.92rod@hotmail.com` (client role) to access the Partner Portal

