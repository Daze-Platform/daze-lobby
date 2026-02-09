
## Add "Back to Dashboard" to Admin Portal Profile Dropdown

**What changes:**
The admin portal's profile dropdown currently only shows the user's email and a "Sign Out" option. This update will add the user's full name, avatar, and a dedicated "Back to Dashboard" button -- matching the internal dashboard's profile styling.

**File to update:** `src/components/portal/PortalHeader.tsx`

1. Add a "Back to Dashboard" menu item in the profile dropdown (both desktop and mobile), positioned above "Sign Out"
2. Import `ArrowLeft` icon (already imported) and add `useNavigate` from react-router-dom
3. The dropdown will show:
   - User name and email (already present)
   - Separator
   - "Back to Dashboard" -- navigates to `/dashboard` (only shown when `isAdmin` or `isAdminViewing`)
   - "Sign Out" -- calls the existing `onSignOut` handler

**File to update:** `src/pages/PortalAdmin.tsx`

4. Change `onSignOut` from `handleBackToDashboard` back to the actual `handleSignOut` function so the Sign Out button properly signs out instead of navigating

---

**Technical Details**

In `PortalHeader.tsx`:
- Add `onBackToDashboard?: () => void` prop to the interface
- Add a new `DropdownMenuItem` with `ArrowLeft` icon and "Back to Dashboard" text, shown conditionally when `isAdminViewing` is true
- Add a `DropdownMenuSeparator` between "Back to Dashboard" and "Sign Out"
- Apply to both the desktop and mobile dropdown menus

In `PortalAdmin.tsx`:
- Pass `onSignOut={handleSignOut}` (actual sign out) instead of `handleBackToDashboard`
- Pass new `onBackToDashboard={handleBackToDashboard}` prop to `PortalHeader`
