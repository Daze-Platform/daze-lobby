
## Complexity and Maintainability Audit

### Critical Issues (Must Fix)

**1. `as any` proliferation in auth forms (LoginForm.tsx, ClientLoginForm.tsx)**
Both login forms use `(sessionResult as any)?.data?.session` in 4+ places each. The fix applied to `useAuth.ts` needs to be replicated here using the same typed assertion pattern:
```typescript
const result = sessionResult as { data: { session: Session | null } };
const session = result.data.session;
```
- Files: `src/components/auth/LoginForm.tsx` (lines 73, 137, 154, 159)
- Files: `src/components/auth/ClientLoginForm.tsx` (lines 73, 127, 136, 137)

**2. `as any` in PostAuth.tsx (line 52)**
`(clientLink?.clients as any)?.client_slug` -- the Supabase join type is not being inferred. Fix with an explicit type assertion for the joined result:
```typescript
const clientSlug = (clientLink?.clients as { client_slug: string } | null)?.client_slug;
```
- File: `src/pages/PostAuth.tsx` (line 52)

**3. `as any` in useMessages.ts (lines 43-44)**
`(msg.profiles as any)?.full_name` -- same Supabase join pattern. Fix with explicit type for the joined `profiles` relation:
```typescript
const profile = msg.profiles as { full_name: string | null; avatar_url: string | null } | null;
```
- File: `src/hooks/useMessages.ts` (lines 43-44)

**4. `as never` workaround in useClientPortal.ts (5 occurrences)**
The `.update({ ... } as never)` pattern on `onboarding_tasks` suppresses a legitimate type mismatch between the JSONB `data` column type and `Record<string, unknown>`. This is a known Supabase codegen limitation. Replacing `as never` with a targeted type assertion is safer:
```typescript
.update({
  data: taskData as Database["public"]["Tables"]["onboarding_tasks"]["Update"]["data"],
  is_completed: true,
  ...
})
```
However, the risk of this breaking anything is low -- the `as never` pattern works and the data shapes are validated upstream. **Recommendation: Warning-level -- defer to post-launch.**

**5. Stale dependency in useAuth.ts `fetchUser` callback (line 50)**
`fetchUser` has `[user]` in its `useCallback` dependency array. Since `fetchUser` sets `user`, this causes a new function reference on every auth event, which triggers the `useEffect` on line 122 (`[fetchUser]` dep) to re-run. In practice the `fetchInProgressRef` guard prevents infinite loops, but the dependency is semantically incorrect. Fix: remove `user` from the dep array (the ref guard makes the stale closure safe).

### Warnings (Fix Post-Launch)

**6. `useClientPortal.ts` is 821 lines**
This hook handles 8 mutations, 2 queries, computed state, and an auto-phase-transition effect. It works correctly but is difficult to maintain. Consider splitting into:
- `useOnboardingTasks` (queries + task mutations)
- `useVenueMutations` (venue CRUD + uploads)
- `usePortalStatus` (phase transition logic)

**7. Console.log statements in production auth flow**
`useAuth.ts` and both login forms contain `console.log("[Auth] ...")` statements. These are useful for debugging but should be behind a `DEBUG` flag or removed before the pilot launch to avoid leaking internal flow details.

**8. `updateClientPhaseMutation` in useEffect dependency (line 776)**
The mutation object is recreated on every render. While `useMutation` returns a stable reference in modern TanStack Query, the ESLint exhaustive-deps rule flags it. Wrapping the `.mutate()` call in a `useCallback` would make the intent clearer.

### Summary Table

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | Critical | LoginForm.tsx | 4x `as any` on session results |
| 2 | Critical | ClientLoginForm.tsx | 4x `as any` on session results |
| 3 | Critical | PostAuth.tsx | `as any` on client slug join |
| 4 | Critical | useMessages.ts | `as any` on profile join |
| 5 | Critical | useAuth.ts | Stale `user` dependency in `fetchUser` |
| 6 | Warning | useClientPortal.ts | 5x `as never`, 821-line file |
| 7 | Warning | Auth files | Console.log in production |
| 8 | Warning | useClientPortal.ts | Mutation in useEffect dep array |

### Implementation Plan

1. Fix all `as any` in LoginForm.tsx, ClientLoginForm.tsx, PostAuth.tsx, and useMessages.ts with proper type assertions
2. Fix `fetchUser` dependency array in useAuth.ts
3. All changes are safe, non-breaking refactors -- no runtime behavior changes
