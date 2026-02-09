# DAZE Onboarding Platform - Architecture Context

> **Purpose:** High-level map for developers and AI agents working on this codebase.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Framework** | React 18 + Vite | SPA with fast HMR |
| **Language** | TypeScript | Strict mode enabled |
| **Styling** | Tailwind CSS + Radix UI | Semantic tokens in `index.css` |
| **Components** | shadcn/ui | Customized in `src/components/ui/` |
| **Animation** | Framer Motion | Physics-based transitions |
| **State** | TanStack Query | Server state management |
| **Drag & Drop** | @dnd-kit | Kanban board interactions |
| **Backend** | Supabase (Lovable Cloud) | PostgreSQL + Auth + Storage |
| **Hosting** | Lovable Cloud | Auto-deployed previews |

---

## Application Architecture

### Two-Interface Split

The application maintains a strict separation between two user experiences:

```
┌─────────────────────────────────────────────────────────────────┐
│                        DAZE Platform                            │
├─────────────────────────────┬───────────────────────────────────┤
│      CONTROL TOWER          │         PARTNER PORTAL            │
│   (Internal Dashboard)      │       (Client-Facing)             │
├─────────────────────────────┼───────────────────────────────────┤
│ Roles: admin, ops_manager,  │ Role: client                      │
│        support              │                                   │
│ Login: /auth                │ Login: /portal/login              │
│ Routes: /dashboard, /clients│ Routes: /portal                   │
│         /blockers, /devices │                                   │
│ Layout: DashboardLayout     │ Layout: PortalLayout              │
│         (sidebar nav)       │         (minimal header)          │
└─────────────────────────────┴───────────────────────────────────┘
```

### Route Protection

```typescript
// Role-based access is enforced at the route level
<RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
  <Dashboard />
</RoleBasedRoute>

<PortalRoute>  // Only allows role: "client"
  <Portal />
</PortalRoute>
```

**Post-Auth Resolver:** `/post-auth` is the single source of truth for redirecting authenticated users to the correct interface based on their role.

---

## Authentication Flow

### Four-Tier RBAC

| Role | Access | Description |
|------|--------|-------------|
| `admin` | Full | All features, user management |
| `ops_manager` | Manage | Client CRUD, phase transitions |
| `support` | View | Read-only dashboard access |
| `client` | Portal | Own client's onboarding portal only |

### Auth Implementation

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  auth.users  │────▶│  user_roles  │     │   profiles   │
│  (Supabase)  │     │   (RBAC)     │     │  (metadata)  │
└──────────────┘     └──────────────┘     └──────────────┘
        │                                         │
        └─────────────────────────────────────────┘
                    Linked by user_id
```

**Key Files:**
- `src/hooks/useAuth.ts` - Listener-first auth state management
- `src/contexts/AuthContext.tsx` - Global auth provider
- `src/lib/auth.ts` - Auth utilities and role checks
- `src/types/auth.ts` - Type definitions

**Security Notes:**
- Roles stored in separate `user_roles` table (prevents privilege escalation)
- RLS policies use `has_role()` and `has_dashboard_access()` database functions
- `@dazeapp.com` emails auto-assigned admin role on signup

---

## Database Schema

### Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                          clients                                │
│  (Core entity - represents a hotel/property being onboarded)   │
├─────────────────────────────────────────────────────────────────┤
│  id, name, phase, onboarding_progress, brand_palette,          │
│  logo_url, legal_entity_name, billing_address, ...             │
└───────────┬─────────────────┬─────────────────┬─────────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │client_contacts│ │    venues     │ │   devices     │
    │ (1:many)      │ │ (1:many)      │ │ (1:many)      │
    ├───────────────┤ ├───────────────┤ ├───────────────┤
    │ name, email,  │ │ name, logo,   │ │ serial_number,│
    │ phone, role,  │ │ menu_pdf_url  │ │ device_type,  │
    │ is_primary    │ │               │ │ status        │
    └───────────────┘ └───────────────┘ └───────────────┘

    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │onboarding_    │ │  documents    │ │blocker_alerts │
    │tasks (1:many) │ │ (1:many)      │ │ (1:many)      │
    ├───────────────┤ ├───────────────┤ ├───────────────┤
    │ task_key,     │ │ file_path,    │ │ reason,       │
    │ is_completed, │ │ category,     │ │ blocker_type, │
    │ data (JSONB)  │ │ display_name  │ │ resolved_at   │
    └───────────────┘ └───────────────┘ └───────────────┘
```

### Multi-Tenancy

```
┌─────────────┐         ┌─────────────┐
│ auth.users  │────────▶│ user_clients│◀────────┌─────────────┐
│             │         │ (junction)  │         │   clients   │
└─────────────┘         └─────────────┘         └─────────────┘
```

- Client users are linked to exactly ONE client via `user_clients`
- `ClientContext` provides the current client to all portal components
- Storage paths are scoped: `brands/{client_id}/`, `venues/{client_id}/`

### Lifecycle Phases

```typescript
type LifecyclePhase = "onboarding" | "reviewing" | "pilot_live" | "contracted";
```

Clients progress through phases tracked on the Kanban board. Completing all onboarding tasks auto-transitions to `pilot_live`.

---

## Key Design Patterns

### 1. Row-Level Security (RLS)

Every table has RLS enabled with policies using database functions:

```sql
-- Example policy pattern
CREATE POLICY "Clients can view their hotel venues"
ON public.venues FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM user_clients WHERE user_id = auth.uid()
  )
  OR has_dashboard_access(auth.uid())
);
```

**Database Functions:**
- `has_role(user_id, role)` - Check specific role
- `has_dashboard_access(user_id)` - Check admin/ops/support
- `is_client(user_id)` - Check client role
- `can_access_client(user_id, client_id)` - Verify client access

### 2. Optimistic UI (Control Tower)

Kanban board uses optimistic updates for instant feedback:

```typescript
// Phase changes update UI immediately, then sync to database
onMutate: async (newPhase) => {
  await queryClient.cancelQueries({ queryKey: ["clients"] });
  const previous = queryClient.getQueryData(["clients"]);
  queryClient.setQueryData(["clients"], (old) => /* optimistic update */);
  return { previous };
},
onError: (err, _, context) => {
  queryClient.setQueryData(["clients"], context?.previous);
},
```

### 3. Centralized Type System

All domain types live in `src/types/`:

```typescript
import type { Client, Venue, OnboardingTask } from "@/types";
```

**Type Files:**
- `client.ts` - Client, ClientContext, LegalEntity
- `venue.ts` - Venue, VenueUpdate, DbVenue
- `task.ts` - OnboardingTask, FormattedTask, DEFAULT_TASKS
- `auth.ts` - AppRole, UserWithRole
- `errors.ts` - AuthError, getErrorMessage

### 4. Hook-Based Logic Separation

UI components focus on rendering; logic lives in hooks:

| Hook | Purpose |
|------|---------|
| `useClients` | Client list with blockers, contacts |
| `useClientPortal` | Full portal state (tasks, venues, branding) |
| `useFormattedTasks` | Task mapping with defaults |
| `useVenueHandlers` | Venue CRUD operations |
| `useAuth` | Session and role management |

### 5. Design Token System

Colors defined as HSL in `index.css`, consumed via Tailwind:

```css
/* index.css */
:root {
  --primary: 266 100% 50%;
  --background: 240 10% 96%;
}

/* Usage in components */
className="bg-primary text-primary-foreground"
```

**Never** use raw colors in components—always use semantic tokens.

---

## File Structure

```
src/
├── components/
│   ├── ui/           # Reusable atoms (shadcn/ui)
│   ├── portal/       # Partner Portal features
│   ├── dashboard/    # Control Tower features
│   ├── kanban/       # Drag-and-drop board
│   ├── auth/         # Login/signup forms
│   ├── layout/       # Route guards, layouts
│   └── modals/       # Dialog components
├── hooks/            # Data fetching & logic
├── contexts/         # React contexts (Auth, Client)
├── types/            # TypeScript definitions
├── lib/              # Utilities (auth, validation)
├── pages/            # Route components
└── integrations/     # Supabase client (auto-generated)

supabase/
├── config.toml       # Supabase configuration
├── functions/        # Edge functions (if any)
└── migrations/       # Database migrations (read-only)
```

---

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `onboarding-assets` | Yes | Brand logos, public assets |
| `client-uploads` | No | Client-uploaded files |
| `contracts` | No | Signed agreements |
| `hotel-documents` | No | Menu PDFs, venue assets |

---

## Critical Conventions

1. **Never edit auto-generated files:**
   - `src/integrations/supabase/client.ts`
   - `src/integrations/supabase/types.ts`
   - `.env`
   - `supabase/config.toml`

2. **Role checks must use database functions**, not client-side logic.

3. **All database changes go through migrations**, not direct edits.

4. **Error handling uses `getErrorMessage(err: unknown)`** from `@/types/errors`.

5. **Component imports use path aliases:** `@/components/`, `@/hooks/`, `@/types/`.

---

## Quick Reference: Key Flows

### Client Onboarding Flow
```
1. Admin creates client → onboarding_tasks seeded
2. Client user assigned → user_clients row created
3. Client logs in → redirected to /portal
4. Client completes tasks → progress updates
5. All tasks done → auto-transition to pilot_live
```

### Admin Portal Viewing
```
1. Admin navigates to /portal/admin
2. Uses AdminClientSwitcher to select client
3. Views portal as client would see it
4. Can make changes on client's behalf
```

---

*Last updated: February 2025*
