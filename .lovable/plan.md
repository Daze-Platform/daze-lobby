

## Wire Admin-Uploaded Documents to Dedicated Client Routes

**What's happening now:** When admins upload documents for a client from the Control Tower, they're correctly stored in the database with the right `client_id`. The real client portal (`/portal`) already displays them. However, the dedicated route (`/portal/springhill-orange-beach`) doesn't know which `client_id` to use -- it only reads from a `?clientId=` URL query param, so the Documents tab shows empty.

**What needs to change:** The `PortalPreview` component needs to resolve the `clientId` automatically for dedicated client routes, so documents (and their badge count) load without requiring a query param.

---

### Changes

**File: `src/pages/PortalPreview.tsx`**

1. Add a lookup query that fetches the client record by name when `clientName` is provided (e.g., "Springhill Suites Orange Beach" matches the DB record)
2. Use the resolved `clientId` from that query (falling back to `previewClientId` from query params for generic preview usage)
3. Pass the resolved `clientId` into both the document count query and the `PortalDocuments` component

This is a small, targeted change -- roughly 10-15 lines added. No new files, no schema changes.

### Technical Detail

```text
PortalPreview receives clientName="Springhill Suites Orange Beach"
  --> Query: SELECT id FROM clients WHERE name ILIKE '%Springhill Suites Orange Beach%' LIMIT 1
  --> resolvedClientId = query result or previewClientId fallback
  --> Document count query uses resolvedClientId
  --> PortalDocuments receives clientIdOverride={resolvedClientId}
```

### Files Modified

- `src/pages/PortalPreview.tsx` -- Add client lookup query by name, use resolved ID for documents
