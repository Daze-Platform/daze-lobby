

# Show Admin Initials and Avatar in Control Tower Header

## What Changes

The profile button in the Control Tower header currently shows a generic person icon for all users. This update will replace it with:

1. **User initials** displayed in a styled circle (matching the portal header pattern)
2. **Profile photo** shown automatically if the admin has uploaded one via Settings

No new upload flow is needed -- avatar upload already exists in the Founder Settings dialog, and the auth system already loads `avatarUrl` from the database. We just need to wire it into the header.

## Technical Details

### File: `src/components/layout/DashboardHeader.tsx`

- Replace the `User` (Lucide) icon import with `Avatar`, `AvatarImage`, `AvatarFallback` from the existing avatar component
- Add a helper function to derive initials from the user's name or email (same pattern used in `PortalHeader` and `SettingsDialog`)
- Replace the generic icon circle (lines 87-89) with an `Avatar` component that:
  - Shows the user's uploaded profile photo if `user.avatarUrl` exists
  - Falls back to styled initials derived from `user.fullName` or `user.email`
- Remove the unused `User` import from lucide-react

### Visual Result

- When no photo is uploaded: A circle with the admin's initials (e.g., "AT" for Angelo Thomas) in the brand's primary color scheme
- When a photo is uploaded via Settings: The photo replaces the initials automatically
- Consistent with the portal header's avatar treatment

### No Database or Backend Changes Required

The `avatarUrl` field is already fetched by the auth system and available via `useAuthContext()`. The avatar upload feature already exists in Settings and stores images in the `profile-avatars` storage bucket.

