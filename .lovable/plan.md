

## Mobile Optimization for Client Portal (iPhone 15 Pro)

The portal already has good responsive foundations with `sm:` breakpoints and 44px touch targets. After thorough review, here are the specific issues and refinements needed for a flawless phone experience.

### Issues Found

**1. VenueCard delete button only appears on hover (`opacity-0 group-hover:opacity-100`)**
On touch devices, there is no hover state. The delete button for venue cards is invisible and inaccessible on mobile.

**2. Bottom navigation overlaps content**
The fixed bottom nav is 56px tall but `pb-24 sm:pb-20 md:pb-0` on the main container may not always provide enough clearance, especially on shorter screens or when the iOS keyboard is open.

**3. Mobile bottom nav "Dashboard" button missing for admins**
When an admin views a portal on mobile, the "Back to Dashboard" button is only in the header (hidden on `md:` breakpoint). The mobile bottom nav has no way to get back to the dashboard.

**4. Signature pad canvas is too small on phones**
The SignaturePad canvas is 400x200 rendered at `h-[150px]`. On a 390px-wide screen, this creates a cramped signing experience that's difficult to use with a finger.

**5. Activity Feed panel width (`w-80 max-w-[90vw]`) clips on small phones**
On a 390px screen, `max-w-[90vw]` = 351px which is fine, but the panel uses `bg-white/80 backdrop-blur-xl` which may cause rendering jank on older devices during the slide animation.

**6. Color palette color picker overflow**
The `ColorPaletteManager` color pickers may overflow on small screens if many colors are added.

**7. Portal login page has no safe-area handling**
The login page on notched iPhones (iPhone 15 Pro) doesn't account for safe areas.

### Changes

**File: `src/components/portal/VenueCard.tsx`**
- Make the delete button always visible on mobile: change `opacity-0 group-hover:opacity-100` to include a mobile-always-visible state using `sm:opacity-0 sm:group-hover:opacity-100` (visible by default on mobile, hover-reveal on desktop)

**File: `src/pages/Portal.tsx`**
- Add admin "Dashboard" button to the mobile bottom nav when `isAdminViewingPortal` is true, replacing the "Sign Out" slot or adding it as an additional item
- Adjust bottom padding to use `pb-28` on mobile for extra breathing room with safe area insets

**File: `src/components/portal/SignaturePad.tsx`**
- Increase canvas height on mobile from `h-[150px]` to `h-[180px]` for better finger-signing UX
- Add a subtle instruction text adjustment for touch devices

**File: `src/components/portal/ActivityFeedPanel.tsx`**
- On mobile (`< md`), make the panel full-width instead of `w-80` for easier reading and interaction
- Simplify the backdrop-blur on mobile to `backdrop-blur-md` for smoother animation performance

**File: `src/components/portal/PortalHeader.tsx`**
- Add admin "Back to Dashboard" button to the mobile section (the `md:hidden` block), so admins on phones can navigate back

**File: `src/index.css`**
- Add `env(safe-area-inset-bottom)` to the mobile bottom nav's padding for proper notch/home-indicator handling on modern iPhones

### What This Does NOT Change
- Desktop and tablet layouts (all changes are scoped to mobile breakpoints)
- Authentication flow or routing logic
- Any data-fetching or mutation logic
- The Welcome Tour (already well-optimized for mobile)
- The ReviewSignModal (already uses `h-[100dvh]` and responsive sizing)

### Files Changed
- `src/components/portal/VenueCard.tsx`
- `src/pages/Portal.tsx`
- `src/components/portal/SignaturePad.tsx`
- `src/components/portal/ActivityFeedPanel.tsx`
- `src/components/portal/PortalHeader.tsx`
- `src/index.css`

