

## Document Sync: Admin Uploads Visible in Client Portal

This plan ensures documents uploaded via the Control Tower (admin sidebar) immediately appear in both the real Client Portal and the Portal Preview.

### Current Behavior

- **Admin Side**: `DocumentUploadSection.tsx` uploads files to the `hotel-documents` bucket and inserts records into the `documents` table with the correct `client_id`
- **Real Portal** (`/portal`): `PortalDocuments.tsx` queries the `documents` table - this already works correctly
- **Preview Portal** (`/portal-preview`): `DemoPortalDocuments.tsx` displays hardcoded mock data - it never shows real documents

### Solution

There are two issues to address:

**Issue 1: Portal Preview shows mock data instead of real documents**

The Portal Preview (`/portal-preview`) uses a demo component that only displays static mock documents. To show real documents, the preview needs to use the real `PortalDocuments` component.

**Issue 2: Query cache synchronization (optional enhancement)**

Currently, admin and client portals use different query keys (`client-documents` vs `portal-documents`). While this doesn't affect real-time database updates (both query fresh data), it means they don't share cache. For consistency, both could use the same key.

### Implementation Steps

**Step 1: Update Portal Preview to use real documents**

Modify `src/pages/PortalPreview.tsx`:
- Import `PortalDocuments` instead of `DemoPortalDocuments` for the documents view
- The real component will query the database using the `clientId` from context
- Since portal preview already uses `ClientProvider`, it will have access to the selected client

**Step 2: Wrap PortalPreview with ClientContext (if needed)**

Check if `PortalPreview` has access to client context. If admin-selected client is not being passed, update the context handling to allow the preview to receive a `clientId` parameter or use the admin's selected client.

**Step 3: Unify query keys (optional enhancement)**

Standardize the query key in both components to `["documents", clientId]` for cache consistency. This ensures that when admin uploads and invalidates the cache, both views refresh automatically.

### Technical Details

**Files to Modify:**

1. `src/pages/PortalPreview.tsx`
   - Replace `DemoPortalDocuments` usage with `PortalDocuments`
   - Ensure ClientContext is available for the documents query

2. `src/components/portal/PortalDocuments.tsx` (optional)
   - Change query key from `["portal-documents", clientId]` to `["documents", clientId]`

3. `src/components/dashboard/DocumentUploadSection.tsx` (optional)
   - Change query key from `["client-documents", clientId]` to `["documents", clientId]`
   - Update invalidation calls to use the unified key

### RLS Security (Already in Place)

The existing Row-Level Security policies ensure:
- **Documents table**: Clients can only view documents where `client_id` matches their assigned client via `user_clients`
- **Storage bucket**: Clients can only download files from their `{client_id}/` folder path
- **Dashboard access**: Admins can view/upload/delete all documents

No database changes are required - the infrastructure is fully functional.

