

## Code Health and Logic Audit -- Fixes

### Critical Fixes

#### 1. Add Missing RLS Policies for `client_contacts`
Add UPDATE and DELETE policies so client-role users can manage their own contacts.

```sql
-- Clients can update their own client contacts
CREATE POLICY "Clients can update their own client contacts"
  ON public.client_contacts FOR UPDATE
  USING (client_id IN (
    SELECT uc.client_id FROM user_clients uc WHERE uc.user_id = auth.uid()
  ))
  WITH CHECK (client_id IN (
    SELECT uc.client_id FROM user_clients uc WHERE uc.user_id = auth.uid()
  ));

-- Clients can delete their own client contacts
CREATE POLICY "Clients can delete their own client contacts"
  ON public.client_contacts FOR DELETE
  USING (client_id IN (
    SELECT uc.client_id FROM user_clients uc WHERE uc.user_id = auth.uid()
  ));
```

#### 2. Fix `: any` in `useAuth.ts` (line 92)
Replace `(sessionResult as any)?.data?.session` with a proper type assertion:
```typescript
const result = sessionResult as { data: { session: Session | null } };
const initialSession = result.data.session;
```

#### 3. Fix `: any` in `useDevices.ts` (line 37)
Remove the `any` cast by using the Supabase-inferred type from the `.select()` call. Destructure `clients` from the join explicitly.

#### 4. Fix `error: any` in `PortalDocuments.tsx` (line 89)
Change `catch (error: any)` to `catch (error: unknown)` and use `getErrorMessage()` or explicit `instanceof Error` checks.

#### 5. Align email payload in `ContactFormModal.tsx` (line 77)
Change `email: email.trim() || null` to `email: email.trim()` since validation guarantees it is non-empty. This aligns the data layer with the UI contract.

### Warning Fixes (Recommended)

#### 6. Add error state UI to sidebar tabs
Add a simple error fallback to the contacts, devices, and activity queries in `ClientDetailPanel` so failed fetches show "Failed to load" instead of infinite loading.

### Files Changed

| File | Change |
|------|--------|
| SQL migration | Add 2 RLS policies for `client_contacts` |
| `src/hooks/useAuth.ts` | Remove `as any` on line 92 |
| `src/hooks/useDevices.ts` | Remove `d: any` on line 37 |
| `src/components/portal/PortalDocuments.tsx` | `error: any` to `error: unknown` |
| `src/components/modals/ContactFormModal.tsx` | `email: email.trim()` (remove `|| null`) |
| `src/components/dashboard/ClientDetailPanel.tsx` | Add `isError` fallback to query-driven tabs |

