

## Display Primary Contact Name in Client Portal Greeting

### What Changes
In the **client-facing** portal, the greeting will show the primary contact's first name (e.g., "Hi John") instead of the property name (e.g., "Langston Street Hotel LLC"). The **admin view** of the portal will continue showing the property name as it does today.

### How

**File: `src/pages/Portal.tsx`**

1. Add a query to fetch the primary contact for the current client from the `client_contacts` table (where `is_primary = true`).
2. Extract the contact's first name from the `name` field (split on space, take the first part).
3. In the greeting heading, use the primary contact's first name when the user is a client, and fall back to the property name for admins or when no primary contact exists.

The greeting line changes from:
- Client sees: "Langston Street Hotel LLC"
- To: "Hi John" (primary contact's first name)

Admin continues to see: "Langston Street Hotel LLC" (property name, unchanged)

### Technical Detail

- Query: `supabase.from("client_contacts").select("name").eq("client_id", clientId).eq("is_primary", true).maybeSingle()`
- First name extraction: `contactName?.split(" ")[0]`
- Conditional display: `isAdminViewingPortal ? client?.name : (primaryFirstName || "Partner")`
- Single file change, no schema or migration needed
