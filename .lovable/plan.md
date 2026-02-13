

## Prepopulate Full Name on Partner Portal Signup

### What This Does
When an admin copies an invite link for a client contact, the link will include the contact's name alongside their email. When the client opens that link, the signup form will have their full name already filled in -- just like it currently works for email.

### How It Works Today
- The invite link looks like: `/portal/daze-beach-resort?email=angelothomas09@gmail.com`
- The `ClientLoginForm` reads the `email` parameter and pre-fills + locks the email field

### What Changes

**1. Include the contact's name in the invite URL (two places)**

Both places that generate invite links will add a `name` parameter:

- **New Client Modal** (the intake wizard) -- uses `contacts[0].firstName` and `contacts[0].lastName`
- **Portal Management Panel** (the sidebar) -- uses `primaryContact.name` from the `client_contacts` table

The resulting link will look like:
```
/portal/daze-beach-resort?email=angelothomas09@gmail.com&name=Angelo+Thomas
```

**2. Read the name parameter in the signup form**

The `ClientLoginForm` will:
- Read `name` from the URL search params (just like it already does for `email`)
- Pre-fill the "Full Name" field with this value
- Lock the field (read-only) so the name stays consistent with what was entered by the admin

### Technical Details

**Files modified:**
- `src/components/modals/NewClientModal.tsx` -- add `name` param to `handleCopyUrl`
- `src/components/dashboard/portal-management/PortalManagementPanel.tsx` -- add `name` param to `inviteUrl` construction
- `src/components/auth/ClientLoginForm.tsx` -- read `name` search param, pre-fill and lock the full name field

All changes follow the exact same pattern already used for the `email` parameter.
