

# Enhance "Copy URL" in New Client Wizard to Show Full Invite Link

## Current State

The New Client wizard (Step 3: Portal Access) **already** generates the invite URL with the primary contact's email appended. The `handleCopyUrl` function correctly builds `/portal/{slug}?email={email}` and copies it to the clipboard.

However, there are two UX gaps:

1. **The URL preview only shows the base path** (`/portal/springhill-suites-orange-beach`) without the `?email=...` portion, so the admin doesn't see what's actually being copied.
2. **There's no label indicating the email is included** -- the admin has no visual confirmation that the invite link is personalized for the primary contact.

## Changes

### File: `src/components/modals/NewClientModal.tsx`

**1. Show the full invite URL (with email) in the preview**

Update the URL preview text (line 672-673) to display the email parameter when available:

```
Before:
  {portalBaseUrl}{customSlug}

After:
  {portalBaseUrl}{customSlug}
  {contacts[0]?.email?.trim() && (
    <span className="text-muted-foreground">?email={contacts[0].email.trim()}</span>
  )}
```

**2. Add a helper label below the URL preview**

Add a small note beneath the URL preview indicating the link is personalized:

```
For: {contacts[0]?.firstName} {contacts[0]?.lastName} ({contacts[0]?.email})
```

This matches the pattern used in the `PortalManagementPanel` invite link card.

**3. Update the copy button label**

Change the button text from generic "Copy" to "Copy Invite Link" when an email is included, mirroring the Portal Management panel pattern.

## Result

After these changes, the Step 3 portal access section will clearly show:
- The full personalized URL including `?email=...`
- The contact name and email it's personalized for
- A labeled "Copy Invite Link" button

This creates a consistent experience between creating a new client and managing an existing one.

## Files Changed

| File | Change |
|------|--------|
| `src/components/modals/NewClientModal.tsx` | Show full invite URL with email in preview, add contact label, update button text |

