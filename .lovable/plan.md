
## Make "New Contact" Button Blue

### Change
Update the "New Contact" button in the Contacts tab of the Client Details Sidebar from `variant="outline"` to `variant="default"`, which renders it with the solid Ocean Blue primary color per the Daze design system.

### Technical Detail

**File: `src/components/dashboard/ClientDetailPanel.tsx`** (line 334)

- Change `variant="outline"` to `variant="default"` on the "New Contact" `Button`.

This single-line change aligns with the brand guideline of using solid Ocean Blue for primary action buttons.
