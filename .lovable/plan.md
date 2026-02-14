

## Add "Change Password" Option to Client Portal Profile Menu

### What Changes
Add a "Change Password" menu item to the user profile dropdown in the portal header (both desktop and mobile). Clicking it opens a small dialog where the client can enter and confirm a new password.

### Files Changed

| File | Change |
|------|--------|
| `src/components/portal/PortalHeader.tsx` | Add "Change Password" menu item to both desktop and mobile profile dropdowns; add a password change dialog inline |

### Implementation Details

**`src/components/portal/PortalHeader.tsx`**

1. Add state: `showPasswordDialog` (boolean), `newPassword`, `confirmPassword`, `isUpdating`
2. Add a `handlePasswordUpdate` function that calls `supabase.auth.updateUser({ password })` with validation (min 8 chars, passwords match)
3. In both desktop and mobile `DropdownMenuContent`, add a new `DropdownMenuItem` with a Key icon and "Change Password" label, placed before the Sign Out item
4. Add a `Dialog` at the bottom of the component with two password inputs, a Save and Cancel button -- reusing the same pattern from the existing `SettingsDialog`

The dialog will include:
- "New Password" input (min 8 characters)
- "Confirm Password" input
- Save / Cancel buttons
- Loading state while updating
- Success toast on completion, error toast on failure

