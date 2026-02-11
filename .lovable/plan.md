

## Fix: Status Badge Clipping in Client Switcher Dropdown

### Problem
In the admin client switcher dropdown, clients with long names (e.g., "Springhill Suites Orange Beach") cause the phase badge to be cut off at the right edge. The dropdown has a fixed width of 340px that cannot accommodate all content.

### Solution
Widen the dropdown and allow the client name to truncate instead of pushing the badge out of view. The badge and percentage should always remain fully visible since they convey critical status information.

### Changes

**File: `src/components/portal/AdminClientSwitcher.tsx`**

1. Increase `SelectContent` width from `w-[340px]` to `w-[380px]`
2. Ensure the client name uses `truncate` with a constrained width so the badge and percentage always have room
3. Add `shrink-0` to the metadata container (percentage + badge) so it never gets compressed

This is a CSS-only fix in a single file -- no logic changes needed.

