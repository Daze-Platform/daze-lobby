
## Fix: Email Verification Redirects Client Users to Control Tower

### Problem
When a client signs up at `/portal/login`, the verification email link sends them to `window.location.origin` (the site root), which resolves to the admin Control Tower. Clients should land back in the portal after verifying.

### Changes

**1. `src/lib/auth.ts` -- Add optional `redirectTo` parameter to `signUp`**

Update the function signature to accept an optional redirect URL. When provided, it overrides the default `window.location.origin`:

```typescript
export async function signUp(
  email: string, password: string, fullName: string, redirectTo?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo || window.location.origin,
      data: { full_name: fullName },
    },
  });
  if (error) throw error;
  return data;
}
```

**2. `src/components/auth/ClientLoginForm.tsx` -- Pass portal-aware redirect URL**

When calling `signUp`, build a redirect URL that includes portal context so PostAuth routes the user correctly after verification:

```typescript
const redirectUrl = returnTo
  ? `${window.location.origin}/post-auth?origin=portal&returnTo=${encodeURIComponent(returnTo)}`
  : `${window.location.origin}/post-auth?origin=portal`;

await withTimeout(signUp(email, password, fullName, redirectUrl), 15000, "...");
```

The `returnTo` value (e.g., `/portal/daze-downtown-hotel`) is already available from search params. This ensures the verification email link sends the user to `/post-auth?origin=portal&returnTo=/portal/daze-downtown-hotel`, where PostAuth resolves their client assignment and routes them to the correct portal.

### No other changes needed
- Admin signups from `/auth` continue using the default `window.location.origin` (no `redirectTo` passed)
- PostAuth already handles `origin=portal` and `returnTo` parameters correctly
- No database or schema changes required

### Files Changed
- `src/lib/auth.ts`
- `src/components/auth/ClientLoginForm.tsx`
