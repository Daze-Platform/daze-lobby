

# Add "Copy Invite Link" to Client Detail Panel

## Overview

Add a one-click "Copy Invite Link" button in the Portal Management section of the Client Detail slide-over panel. This generates the full portal URL with the primary contact's email pre-filled, ready to send to the GM.

## Where It Goes

Inside `PortalManagementPanel.tsx`, above the existing Documents/Brand/Venues tabs -- a small card with:
- The generated portal URL displayed as a preview (truncated)
- A "Copy Invite Link" button that copies the full URL to clipboard
- Auto-includes the primary contact's email as the `?email=` parameter
- A fallback "Copy URL (no email)" if no primary contact exists

## Example Output

Clicking the button copies:
```
https://onboarding.dazeapp.com/portal/springhill-suites-orange-beach?email=msutherland@vistahost.com
```

## Technical Details

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/portal-management/PortalManagementPanel.tsx` | Add invite link section with copy button |

### Implementation

1. **Fetch client slug and primary contact email** -- Add a query for the client's `client_slug` and primary contact email (or accept them as props from the parent `ClientDetailPanel` which already fetches contacts).

2. **Add an "Invite Link" card** above the tabs section:
   - Display the slug-based URL in a monospace preview
   - Show the primary contact name/email if available
   - "Copy Invite Link" button using `navigator.clipboard.writeText()`
   - Toast confirmation: "Invite link copied to clipboard"

3. **Props approach**: Pass `clientSlug` from `ClientDetailPanel` (which has access to `hotel.client_slug`) and `primaryContactEmail` (from the already-fetched contacts list) into `PortalManagementPanel`.

### UI Layout

```text
+------------------------------------------+
| Portal Invite Link                       |
| portal/springhill-suites-orange-beach     |
| For: Matt Sutherland (msutherland@...)   |
|                          [Copy Link]     |
+------------------------------------------+
| [Documents] [Brand/POS] [Venues]         |
| ...                                      |
```

