
# Simplify Device Setup Step

## Overview
Transform the Device Setup step from a two-choice selection with quantity picker into a simple Yes/No toggle question asking whether the client is requesting devices from Daze.

## Changes

### UI Simplification

**Before:**
- Two card options: "Use Daze Tablets" vs "Use Our Own Devices"
- Quantity picker (1-20) when Daze tablets selected
- Confirmation flow with detailed messaging

**After:**
- Simple question: "Would you like Daze to provide tablets for your property?"
- Clean Yes/No toggle using a Switch component
- Streamlined confirmation with contextual messaging

### File Changes

**`src/components/portal/steps/DevicesStep.tsx`**
- Replace the dual-card selection UI with a single toggle switch
- Remove the tablet quantity picker and related state (`tabletCount`, `handleTabletCountChange`)
- Simplify the `DeviceChoice` type to just `boolean | null` for requesting devices
- Update the question text to: "Would you like Daze to provide tablets for your property?"
- Simplify the confirmed state display
- Remove unused imports (`Input`, `Minus`, `Plus`, `Monitor`)
- Update badge text in the accordion trigger to show "Requesting Devices" or "No Devices Needed"
- Update toast messages accordingly

### Data Structure
The existing data structure remains backward-compatible:
- `requesting_devices: true` (Yes) → stored as `use_daze_tablets: true` (no tablet_count)
- `requesting_devices: false` (No) → stored as `use_daze_tablets: false`

This maintains compatibility with existing data while removing the quantity concept.

---

## Technical Details

### Component State Changes
```text
Before:
- selectedChoice: "daze" | "own" | null
- tabletCount: number
- isConfirmed: boolean

After:
- requestingDevices: boolean | null
- isConfirmed: boolean
```

### UI Layout
```text
+------------------------------------------+
| Would you like Daze to provide tablets   |
| for your property?                       |
|                                          |
| [Description text about what this means] |
|                                          |
|         No  [==O==]  Yes                 |
|                                          |
|      [ Confirm Selection ]               |
+------------------------------------------+
```

### Confirmed State Display
- **Yes:** "Devices Requested" with a note that Daze will coordinate shipping
- **No:** "No Devices Needed" with a note that installation instructions will be sent
