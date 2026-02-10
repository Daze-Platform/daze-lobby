

# Remove Portal Preview, Use Real Portal for Slug Routes

## What's Changing

The separate `PortalPreview` page is being removed. The `/portal/:clientSlug` route will render the real `Portal` experience instead. Admins will access client portals via a "View Portal" button on each client card in the Clients page.

## Changes

### 1. Delete `src/pages/PortalPreview.tsx`

This 497-line file is no longer needed. All its functionality is already covered by `Portal.tsx`.

### 2. Delete `src/components/layout/DedicatedPortalRoute.tsx`

No longer needed -- the slug route will use the existing `PortalRoute` or a simplified guard.

### 3. Create a new route component for slug-based access

A new lightweight wrapper page (`src/pages/PortalBySlug.tsx`) that:
- Reads `clientSlug` from the URL params
- Resolves the slug to a `clientId` via a database lookup
- Wraps the existing `Portal` component inside a `ClientProvider` override with that resolved `clientId`
- Shows a loading spinner while resolving, and a "not found" state if the slug is invalid

This keeps the real `Portal.tsx` untouched and reuses all its logic (activity feed, documents, progress, welcome tour).

### 4. Update `src/App.tsx` routing

- Remove the `PortalPreview` and `DedicatedPortalRoute` imports
- Change the `/portal/:clientSlug` route to use the new `PortalBySlug` wrapper with appropriate auth guarding
- Remove the `/portal-preview` redirect route
- Keep all other routes unchanged

### 5. Add "View Portal" button to Clients page

In `src/pages/Clients.tsx`, add a button on each client card:
- Icon: `ArrowSquareOut` (Phosphor) or `ExternalLink` (Lucide)
- Positioned next to the notify bell and phase badge
- Clicks navigate to `/portal/{client.client_slug}` (opens in new tab)
- Only shown when `client.client_slug` is present
- `e.stopPropagation()` to prevent triggering the card's detail panel

### 6. Remove `/portal/admin` sidebar link (optional cleanup)

If there are sidebar references to "Portal Preview", update them to point to the Clients page instead since the preview is now accessed per-client.

## Technical Details

### New File: `src/pages/PortalBySlug.tsx`

```
- Read clientSlug from useParams
- Query clients table: .eq("client_slug", slug).single()
- If loading: show spinner
- If not found: show 404-style message
- If found: render Portal inside a ClientProvider with the resolved clientId
- Auth guard: require authentication, redirect to /portal/login if not
```

### Modified File: `src/App.tsx`

- Remove `PortalPreview` import
- Remove `DedicatedPortalRoute` import
- Add `PortalBySlug` import
- Update `/portal/:clientSlug` route element

### Modified File: `src/pages/Clients.tsx`

- Add an `ExternalLink` or `ArrowSquareOut` icon button per client card
- Link target: `/portal/${client.client_slug}` opened in a new tab
- Tooltip: "View portal"

### Deleted Files
- `src/pages/PortalPreview.tsx`
- `src/components/layout/DedicatedPortalRoute.tsx`
