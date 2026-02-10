
# Fix: Preserve Portal Slug Through Auth Flow

## Problem

When a GM visits `/portal/springhill-suites-orange-beach` while unauthenticated:
1. `PortalRoute` redirects to `/portal/login` but drops the slug (no `returnTo` param)
2. After login, `PostAuth` sends client users to `/portal/login`, which `AuthRedirect` bounces back to `PostAuth` -- creating an infinite redirect loop

## Solution

Two targeted fixes:

### 1. `src/components/layout/PortalRoute.tsx` -- Preserve the slug

When redirecting unauthenticated users to `/portal/login`, include the current path as a `returnTo` query param so the slug survives the auth flow.

**Change (line 34-36):**
```typescript
// Before
return <Navigate to="/portal/login" replace />;

// After -- preserve the slug
const currentPath = window.location.pathname;
return <Navigate to={`/portal/login?returnTo=${encodeURIComponent(currentPath)}`} replace />;
```

### 2. `src/pages/PostAuth.tsx` -- Fix the client user loop

When a client user has no `returnTo`, instead of sending them to `/portal/login` (which loops), look up their assigned client slug and redirect directly to `/portal/:slug`.

**Changes:**
- Query `user_clients` joined with `clients` to get the user's `client_slug`
- If found, navigate to `/portal/{slug}` directly
- If not found (no client assigned), navigate to an error/no-hotel page
- This eliminates the `/portal/login` -> `PostAuth` -> `/portal/login` loop

```typescript
// In targetPath logic, replace:
if (isClient(role)) return "/portal/login";

// With a resolved slug path:
if (isClient(role) && clientSlug) return `/portal/${clientSlug}`;
if (isClient(role) && !clientSlugLoading) return "/no-hotel-assigned";
```

This requires adding a small query in `PostAuth` to fetch the client slug for client-role users:
```typescript
const { data: clientLink, isLoading: clientSlugLoading } = useQuery({
  queryKey: ["user-client-slug", user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from("user_clients")
      .select("clients(client_slug)")
      .eq("user_id", user!.id)
      .maybeSingle();
    return data;
  },
  enabled: isClient(role) && !!user?.id && !returnTo,
});
```

## Complete Flow After Fix

1. GM clicks link to `/portal/springhill-suites-orange-beach`
2. `PortalRoute` redirects to `/portal/login?returnTo=%2Fportal%2Fspringhill-suites-orange-beach`
3. GM signs up, verifies email, signs in
4. `ClientLoginForm` sends to `/post-auth?origin=portal&returnTo=%2Fportal%2Fspringhill-suites-orange-beach`
5. `PostAuth` sees `returnTo` and navigates to `/portal/springhill-suites-orange-beach`
6. Portal loads successfully

For returning client users with no `returnTo` (e.g., visiting `/portal/login` directly):
1. Login succeeds, goes to `/post-auth?origin=portal`
2. `PostAuth` looks up their assigned client slug
3. Navigates to `/portal/{their-slug}` directly -- no loop

## Files Changed

| File | Change |
|------|--------|
| `src/components/layout/PortalRoute.tsx` | Add `returnTo` param when redirecting unauthenticated users |
| `src/pages/PostAuth.tsx` | Look up client slug for client-role users instead of redirecting to `/portal/login` |
