
# Code Quality & Maintainability Refactor

## Executive Summary

This refactoring plan addresses code quality, type safety, and architectural concerns to support future AI-agent development and reduce maintenance burden. The codebase is already well-structured in many areas - this plan focuses on targeted improvements.

---

## Audit Results

### Current State Assessment

| Area | Status | Notes |
|------|--------|-------|
| Modularization | Good | Hooks pattern already established |
| Type Safety | Needs Work | 7 instances of `: any`, missing centralized types |
| Dead Code | Minimal | Backwards-compatibility aliases can be removed |
| File Structure | Good | Clear separation, minor gaps |

---

## 1. Modularization (Hook Pattern)

### Assessment: Already Well Implemented

The codebase follows the hook pattern consistently:

| Page | Data Hook | Status |
|------|-----------|--------|
| `Dashboard.tsx` | `useClients()` | Proper separation |
| `Portal.tsx` | `useClientPortal()` | 725 lines, comprehensive |
| `PortalAdmin.tsx` | `useClientPortal()` | Reuses same hook |

### Recommended Improvements

**Extract Shared Task Formatting Logic**

Both `Portal.tsx` and `PortalAdmin.tsx` duplicate the same `formattedTasks` memoization logic.

```typescript
// Create: src/hooks/useFormattedTasks.ts
export function useFormattedTasks(tasks: OnboardingTask[]) {
  return useMemo(() => 
    tasks.length > 0 
      ? tasks.map(t => ({
          key: t.task_key,
          name: t.task_name,
          isCompleted: t.is_completed,
          data: t.data,
        }))
      : DEFAULT_TASKS,
    [tasks]
  );
}
```

**Extract Venue Handlers**

The venue CRUD handlers (`handleAddVenue`, `handleUpdateVenue`, etc.) are duplicated across 3 files.

```typescript
// Create: src/hooks/useVenueHandlers.ts
export function useVenueHandlers(portalHook: ReturnType<typeof useClientPortal>) {
  const handleAddVenue = async (): Promise<Venue | undefined> => { ... };
  const handleUpdateVenue = async (id: string, updates: {...}) => { ... };
  const handleRemoveVenue = async (id: string) => { ... };
  // ... return all handlers
}
```

---

## 2. Strict Type Safety

### Issue: `any` Type Usage (7 instances)

Located in auth form components:

| File | Line | Issue |
|------|------|-------|
| `ResetPasswordForm.tsx` | 52 | `catch (err: any)` |
| `LoginForm.tsx` | 177, 209 | `catch (err: any)` |
| `ClientLoginForm.tsx` | 149, 182 | `catch (err: any)` |
| `ForgotPasswordForm.tsx` | 32 | `catch (err: any)` |
| `SignUpForm.tsx` | 40, 61 | `catch (err: any)` |

### Solution: Create Error Type Utility

```typescript
// Create: src/types/errors.ts
export interface AuthError extends Error {
  message: string;
  code?: string;
  status?: number;
}

export function isAuthError(err: unknown): err is AuthError {
  return err instanceof Error;
}

export function getErrorMessage(err: unknown): string {
  if (isAuthError(err)) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred';
}
```

Update pattern:
```typescript
// Before
} catch (err: any) {
  setError(err.message || "Failed to sign in");
}

// After
} catch (err: unknown) {
  setError(getErrorMessage(err));
}
```

### Issue: Scattered Type Definitions

Types are defined inline in multiple locations:

- `Venue` in `VenueCard.tsx` (imported 7 times)
- `OnboardingTask` in `useClientPortal.ts`
- `Client` in `ClientContext.tsx` and `useClients.ts` (duplicated)

### Solution: Centralize Domain Types

```text
src/types/
├── index.ts          # Re-exports all types
├── client.ts         # Client, Contact, LegalEntity
├── venue.ts          # Venue, VenueUpdate
├── task.ts           # OnboardingTask, TaskKey, FormattedTask
├── auth.ts           # UserWithRole, AppRole (move from lib/auth.ts)
├── errors.ts         # AuthError, getErrorMessage
└── activity.ts       # ActivityLog, ActivityAction
```

**Primary Type File: `src/types/client.ts`**

```typescript
import type { Tables, Enums } from "@/integrations/supabase/types";

// Core client type derived from database
export type ClientRow = Tables<"clients">;
export type LifecyclePhase = Enums<"lifecycle_phase">;

// Extended client with computed fields
export interface Client extends ClientRow {
  hasBlocker: boolean;
  primaryContact: Tables<"client_contacts"> | null;
  dazeDeviceCount: number;
  incompleteCount: number;
  hasRecentReminder: boolean;
}

// Legal entity fields (extracted for reuse)
export interface LegalEntity {
  legal_entity_name: string | null;
  billing_address: string | null;
  authorized_signer_name: string | null;
  authorized_signer_title: string | null;
}
```

**Primary Type File: `src/types/venue.ts`**

```typescript
import type { Tables } from "@/integrations/supabase/types";

// Database venue row
export type VenueRow = Tables<"venues">;

// UI venue with optional file attachments
export interface Venue {
  id: string;
  name: string;
  menuFile?: File;
  menuFileName?: string;
  menuPdfUrl?: string;
  logoFile?: File;
  logoUrl?: string;
}

// Venue update payload
export interface VenueUpdate {
  name?: string;
  menuPdfUrl?: string;
  logoUrl?: string;
}
```

---

## 3. Dead Code Removal

### Backwards Compatibility Aliases

These "Hotel" aliases were created during the data model pivot but are no longer referenced:

**File: `src/contexts/ClientContext.tsx`** (lines 177-180)
```typescript
// REMOVE these unused exports
export const HotelProvider = ClientProvider;
export const useHotel = useClient;
export type Hotel = Client;
```

**File: `src/hooks/useClients.ts`** (lines 192-195)
```typescript
// REMOVE these unused exports
export type Hotel = Client;
export const useHotels = useClients;
export const useUpdateHotelPhase = useUpdateClientPhase;
```

### Legacy Naming in Components

**File: `src/components/portal/AdminHotelSwitcher.tsx`**
- Rename to `AdminClientSwitcher.tsx`
- Update index.ts export

**File: `src/components/dashboard/HotelDetailPanel.tsx`**
- Rename to `ClientDetailPanel.tsx`
- Update index.ts export

### TODO Comments

**File: `src/components/modals/BlockerResolutionModal.tsx`** (line 111)
```typescript
// TODO: For non-navigation actions, could open a detail panel
```
- Either implement or remove this TODO

---

## 4. File Structure Organization

### Current Structure (Good)

```text
src/
├── components/
│   ├── ui/          # Reusable atoms (buttons, cards, inputs)
│   ├── portal/      # Portal feature components
│   ├── dashboard/   # Dashboard feature components
│   ├── kanban/      # Kanban board components
│   ├── auth/        # Authentication forms
│   ├── layout/      # Layout wrappers, protected routes
│   ├── modals/      # Modal dialogs
│   └── settings/    # Settings components
├── hooks/           # Data/logic hooks (14 files)
├── contexts/        # React contexts
├── lib/             # Utilities
└── pages/           # Route components
```

### Recommended Additions

```text
src/
├── types/           # NEW: Centralized type definitions
│   ├── index.ts
│   ├── client.ts
│   ├── venue.ts
│   ├── task.ts
│   ├── auth.ts
│   └── errors.ts
├── lib/
│   └── validation/  # NEW: Move file validation here
│       ├── file.ts
│       └── password.ts
```

---

## Implementation Phases

### Phase 1: Type Safety Foundation (Priority: High)
1. Create `src/types/` directory with all type files
2. Fix all 7 `: any` instances in auth forms
3. Update imports across codebase to use centralized types

### Phase 2: Dead Code Cleanup (Priority: Medium)
1. Remove backwards compatibility aliases from `ClientContext.tsx`
2. Remove backwards compatibility aliases from `useClients.ts`
3. Rename `AdminHotelSwitcher` to `AdminClientSwitcher`
4. Rename `HotelDetailPanel` to `ClientDetailPanel`
5. Address or remove TODO comment

### Phase 3: Hook Extraction (Priority: Low)
1. Create `useFormattedTasks.ts` hook
2. Create `useVenueHandlers.ts` hook
3. Refactor Portal pages to use new hooks

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Re-exports all types |
| `src/types/client.ts` | Client, Contact, LegalEntity types |
| `src/types/venue.ts` | Venue, VenueUpdate types |
| `src/types/task.ts` | OnboardingTask, FormattedTask types |
| `src/types/auth.ts` | UserWithRole, AppRole types |
| `src/types/errors.ts` | Error handling utilities |
| `src/hooks/useFormattedTasks.ts` | Task formatting logic |
| `src/hooks/useVenueHandlers.ts` | Venue CRUD handlers |

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/ClientContext.tsx` | Remove Hotel aliases, use centralized types |
| `src/hooks/useClients.ts` | Remove Hotel aliases, use centralized types |
| `src/components/auth/*.tsx` | Fix `: any` to `: unknown` with type guard |
| `src/components/portal/VenueCard.tsx` | Move type to `src/types/venue.ts` |
| `src/hooks/useClientPortal.ts` | Use centralized types |
| `src/lib/auth.ts` | Export types from `src/types/auth.ts` instead |
| `src/pages/Portal.tsx` | Use extracted hooks |
| `src/pages/PortalAdmin.tsx` | Use extracted hooks |

## Files to Rename

| Current | New |
|---------|-----|
| `AdminHotelSwitcher.tsx` | `AdminClientSwitcher.tsx` |
| `HotelDetailPanel.tsx` | `ClientDetailPanel.tsx` |

---

## Impact Analysis

### Benefits
- **Type Safety**: Eliminates `any` types, prevents property hallucination in AI edits
- **Maintainability**: Single source of truth for domain types
- **DX**: Cleaner imports, better IDE autocomplete
- **AI Context**: Reduced noise from dead code and duplications

### Risks
- **Import Updates**: Many files will need import path changes
- **Testing**: Need to verify all type migrations work correctly

### Estimated Effort
- Phase 1: ~2 hours
- Phase 2: ~30 minutes
- Phase 3: ~1 hour
