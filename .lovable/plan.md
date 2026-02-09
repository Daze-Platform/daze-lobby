

# Link Dedicated Portal Routes to Client IDs

## Problem
Currently, each client portal route (e.g. `/portal/springhill-orange-beach`) is hardcoded in `App.tsx` with a `clientName` prop. The portal then does a fuzzy name search (`ilike`) to resolve the client ID. This is fragile and requires a code change every time a new client is added.

## Solution
Replace all hardcoded dedicated routes with a single dynamic route that uses a URL-friendly slug stored on each client record.

### How it works

1. **New `client_slug` column** on the `clients` table (e.g. `springhill-orange-beach`, `daze-beach-resort`)
2. **Single dynamic route**: `/portal/:clientSlug` replaces all hardcoded `/portal/springhill-orange-beach`, `/portal/daze-beach-resort` routes
3. **Exact lookup**: `PortalPreview` resolves the client by slug instead of fuzzy name matching
4. **Admin creates slug**: The New Client modal auto-generates a slug from the client name (editable)

### User flow
- Admin creates "Springhill Suites Orange Beach" -- slug auto-generates as `springhill-suites-orange-beach`
- The portal URL becomes `/portal/springhill-suites-orange-beach`
- The client code (`CLT-001`) is already assigned automatically

## Technical Details

### 1. Database Migration
- Add `client_slug text UNIQUE` column to `clients`
- Create a trigger to auto-generate slug from `name` on insert (lowercase, hyphens, no special chars)
- Backfill existing clients with slugs derived from their names

### 2. Routing Changes (`src/App.tsx`)
- Remove all hardcoded dedicated portal routes (`/portal/springhill-orange-beach`, `/portal/daze-beach-resort`)
- Add a single dynamic route: `/portal/:clientSlug`
- Keep `/portal/admin`, `/portal/login`, and `/portal` (authenticated client) routes above the dynamic catch

```text
Route priority (top to bottom):
  /portal/admin    --> RoleBasedRoute (admin portal viewer)
  /portal/login    --> AuthRedirect (client login)
  /portal/:slug    --> DedicatedPortalRoute (dynamic client portal)
  /portal          --> PortalRoute (authenticated client portal)
```

### 3. Update `PortalPreview.tsx`
- Accept a `clientSlug` prop (from URL param) instead of `clientName`
- Query: `supabase.from("clients").select("id, name, ...").eq("client_slug", slug).single()`
- Use the resolved client name for display

### 4. Update `DedicatedPortalRoute.tsx`
- Remove the hardcoded `ADMIN_ALLOWED_PORTAL_PATHS` allowlist
- Instead, allow all admin users to access any `/portal/:slug` route (they need this for previewing)

### 5. Update `NewClientModal.tsx`
- Auto-generate a slug field from the client name as the admin types
- Show the slug as a read-only preview (e.g. "Portal URL: /portal/springhill-suites-orange-beach")

### 6. Sidebar Link
- Update the "Client Portal" link in `DashboardSidebar.tsx` to point to a default demo client slug or keep as `/portal/daze-beach-resort`

### 7. Redirect for legacy URLs
- Add redirects for old hardcoded paths (`/portal/springhill-orange-beach` to `/portal/springhill-suites-orange-beach`) if needed, or rely on the dynamic route handling them naturally if slugs match

