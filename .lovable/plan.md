
## Fix: Preserve Client Name in Portal Redirect

### Current State

The invite link generation is correct in both places:

- **PortalManagementPanel** (line 85): includes `name` param
- **NewClientModal** (line 187): includes `name` param

Example generated URL:
`/portal/the-grand?email=jane@hotel.com&name=Jane%20Smith`

The **ClientLoginForm** already reads the `name` param (line 45) and pre-fills the Full Name field.

### The Bug

**`PortalRoute.tsx` line 32** only forwards the `email` parameter when redirecting unauthenticated users to the login page. The `name` parameter is silently dropped.

```
// Current (broken)
const loginUrl = `/portal/login?returnTo=...${emailParam ? `&email=...` : ""}`;
//                                              ^ no name!
```

### Fix

**File: `src/components/layout/PortalRoute.tsx`** (line 30-33)

- Extract the `name` param from the current URL search params (same pattern as `email`)
- Append it to the login redirect URL so `ClientLoginForm` receives it

```
const nameParam = searchParams.get("name");
const loginUrl = `/portal/login?returnTo=...
  ${emailParam ? `&email=...` : ""}
  ${nameParam ? `&name=...` : ""}`;
```

One small change, no functional or structural impact beyond preserving the existing `name` parameter through the redirect.
