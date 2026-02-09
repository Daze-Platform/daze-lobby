
# Add User Profile Menu to Client Portal Header

## Overview

Add a professional user profile dropdown menu to the top-right of the Portal header, allowing clients to see their identity and sign out. This follows the same pattern already used in the admin `DashboardHeader` component.

## Current State

- **Portal Header**: Currently shows email as plain text + Sign Out button
- **Dashboard Header**: Already has a fully functional profile dropdown with Avatar, name, email, role badge, and sign out
- **User Data**: `UserWithRole` type includes `fullName` but is missing `avatarUrl`
- **Profiles Table**: Has `avatar_url` column that is not being fetched in auth flow

## Implementation Plan

### 1. Extend User Type to Include Avatar URL

Update the `UserWithRole` interface and `getCurrentUser()` function to fetch and expose the user's avatar URL.

**File**: `src/lib/auth.ts`

```typescript
export interface UserWithRole {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;  // NEW
  role: AppRole | null;
}
```

Update `getCurrentUser()` to select `avatar_url` alongside `full_name`:

```typescript
const { data: profileData } = await supabase
  .from("profiles")
  .select("full_name, avatar_url")  // Add avatar_url
  .eq("user_id", user.id)
  .maybeSingle();

return {
  id: user.id,
  email: user.email || "",
  fullName: profileData?.full_name || null,
  avatarUrl: profileData?.avatar_url || null,  // NEW
  role: roleData?.role as AppRole | null,
};
```

### 2. Update Portal Header with Profile Dropdown

Replace the plain email text and Sign Out button with a proper profile dropdown menu.

**File**: `src/components/portal/PortalHeader.tsx`

Add new props:
- `userFullName?: string` - User's display name
- `userAvatarUrl?: string | null` - User's profile picture URL

New UI structure for the right section:

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] PREVIEW   |  Onboarding  Documents  |  [Avatar▼]       │
└─────────────────────────────────────────────────────────────────┘
                                                      │
                                                      ▼
                                              ┌──────────────────┐
                                              │ John Smith       │
                                              │ john@hotel.com   │
                                              │ ─────────────────│
                                              │ 🚪 Sign Out      │
                                              └──────────────────┘
```

**Components to import**:
- `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar`
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, etc. from `@/components/ui/dropdown-menu`

**Avatar Fallback Logic**:
```typescript
// Generate initials from name or email
const getInitials = (name?: string, email?: string) => {
  if (name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return email?.charAt(0).toUpperCase() || "U";
};
```

### 3. Update Portal Page to Pass New Props

**File**: `src/pages/Portal.tsx`

Pass the new user data props to PortalHeader:

```typescript
<PortalHeader
  // ... existing props
  userEmail={user?.email}
  userFullName={user?.fullName || undefined}
  userAvatarUrl={user?.avatarUrl}
  onSignOut={handleSignOut}
/>
```

### 4. Update Portal Preview for Consistency

**File**: `src/pages/PortalPreview.tsx`

Pass demo user data to maintain UI parity:

```typescript
<PortalHeader
  // ... existing props
  userEmail="demo@grandhydatt.com"
  userFullName="Demo User"
  userAvatarUrl={undefined}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/auth.ts` | Add `avatarUrl` to `UserWithRole` type and fetch it in `getCurrentUser()` |
| `src/components/portal/PortalHeader.tsx` | Replace email text with Avatar dropdown menu |
| `src/pages/Portal.tsx` | Pass `userFullName` and `userAvatarUrl` props to header |
| `src/pages/PortalPreview.tsx` | Pass demo user props for UI parity |

---

## UI Design Details

### Profile Dropdown Trigger
- Circular Avatar (32x32px) with hover effect
- Shows profile picture or initials fallback
- Subtle border matching design system

### Dropdown Content
- User's full name (bold)
- User's email (muted)
- Separator line
- "Sign Out" action with logout icon

### Mobile Behavior
- Avatar trigger visible on all screen sizes
- Dropdown menu adapts to screen width

---

## Technical Notes

- **Design Consistency**: Follows the existing `DashboardHeader` pattern exactly
- **Avatar Storage**: Uses existing `onboarding-assets` bucket for profile pictures
- **Fallback Strategy**: Shows initials when no avatar is uploaded
- **Accessibility**: Dropdown uses Radix primitives with proper focus management
