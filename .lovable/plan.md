
## Mobile Responsive Design Audit and Refinements

### Assessment Summary

The application already has a strong mobile-first responsive design foundation, including:
- Safe area inset support for notched devices
- Mobile bottom navigation on the Portal
- Sheet-based sidebar drawer on the Dashboard
- Responsive typography, spacing, and grid layouts
- 44px minimum touch targets on interactive elements

However, several refinements will improve the mobile experience:

---

### Refinements to Implement

#### 1. Portal Header -- Missing Mobile Tab Navigation for Onboarding/Documents
The center navigation tabs (Onboarding | Documents) use `hidden md:flex`, meaning on mobile they're only accessible via the bottom nav bar. This is fine, but the header shows no indication of the current active view on mobile. Add a subtle active view label next to the logo on small screens.

#### 2. Client List Action Buttons -- Touch Target Issues
On the Clients page, action buttons (View Portal, Delete, Notify) are `h-8 w-8` icon buttons. These are only 32px, which falls below the 44px minimum touch target for mobile. Increase to `h-10 w-10` on mobile while keeping `h-8 w-8` on desktop via responsive classes.

#### 3. Blockers Page -- Card Action Buttons Accessibility
Similar to the Clients page, ensure the "View Portal" and "Send Reminder" action buttons on blocker cards meet the 44px minimum touch target on mobile.

#### 4. Devices Page -- Filter Row Overflow
The Devices page has a filter toolbar with a search input, type dropdown, and status dropdown all in a row. On narrow screens, these can get cramped. Ensure the filters stack vertically on mobile.

#### 5. Dashboard Stat Cards -- Text Truncation on Small Screens
The 3-column stat grid (`grid-cols-3`) can cause the "Total Clients" label to truncate on very narrow screens (320px). Add word wrapping or allow the grid to collapse to a scroll-friendly layout on the smallest devices.

#### 6. Kanban Board -- Column Min-Width Polish
Kanban columns use `min-w-[280px]` which is appropriate, but the horizontal scroll container uses `-mx-4 px-4` which can cause clipping on some devices. Verify and ensure consistent edge padding.

#### 7. ReviewSignModal -- Full-Screen on Mobile
The pilot agreement modal is already a Dialog, but on mobile the legal text and signature pad need enough room. Ensure the dialog uses full-screen mode on small devices for better signing experience.

---

### Technical Changes

| File | Change |
|------|--------|
| `src/pages/Clients.tsx` | Increase action button touch targets to `h-10 w-10 sm:h-8 sm:w-8` |
| `src/pages/Devices.tsx` | Verify filter toolbar stacks on mobile, fix if needed |
| `src/pages/Dashboard.tsx` | Add `text-[8px] sm:text-[9px]` and `break-words` to stat label micro text for 320px screens |
| `src/pages/Blockers.tsx` | Increase action button touch targets on mobile |
| `src/components/portal/ReviewSignModal.tsx` | Add `max-w-full sm:max-w-4xl h-[100dvh] sm:h-auto` for mobile full-screen dialog |
| `src/components/portal/PortalHeader.tsx` | Add a small active-view indicator visible on mobile (below md breakpoint) |
| `src/components/portal/VenueCard.tsx` | Verify file upload drop zones have adequate touch targets |

### Out of Scope (Already Well-Handled)
- Auth pages (both admin and client) -- render cleanly on mobile
- Bottom navigation bar with safe-area insets -- already implemented
- Sidebar drawer on dashboard -- already uses Sheet component
- Portal greeting and progress ring -- already has size variants per breakpoint
- Activity feed panel -- already uses full-width on mobile
