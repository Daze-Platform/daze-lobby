

# Device Management Enhancement Plan

## Overview

This plan addresses two major changes:

1. **Dashboard Metric Simplification**: Change "Devices Online" to "Devices" and count only Daze-owned tablets (not client-owned devices)
2. **New Onboarding Task**: Add a "Devices" step after POS Integration where clients choose between using Daze tablets or their own devices

---

## Current State Analysis

### Dashboard (Control Tower)
- The "Devices Online" metric currently shows `devicesOnline/totalDevices` (e.g., "12/15")
- It counts ALL devices in the `devices` table regardless of ownership
- The `devices` table tracks: `hotel_id`, `device_type`, `serial_number`, `status`, `install_date`, `last_check_in`

### Devices Table Schema
Current columns do not distinguish between Daze-owned and client-owned devices:
```
- id, hotel_id, device_type, serial_number
- status (online | offline | maintenance)
- install_date, last_check_in, created_at, updated_at
```

### Onboarding Flow
Current task order in `TaskAccordion.tsx`:
```
1. Legal (Agreement signing)
2. Brand (Logo & colors)
3. Venue (F&B outlets)
4. POS (Point-of-sale integration)
```

---

## Implementation Plan

### Part 1: Database Schema Update

Add a new column to the `devices` table to track ownership:

```sql
ALTER TABLE public.devices 
ADD COLUMN is_daze_owned BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.devices.is_daze_owned IS 
  'True if this is a Daze-provided tablet, false if client-owned device';
```

**Why this approach?**
- Simple boolean flag keeps the schema clean
- Defaults to `true` since most existing devices are likely Daze-owned
- Easy to filter in queries

---

### Part 2: Dashboard Metric Update

**File: `src/pages/Dashboard.tsx`**

Update the stat card from "Devices Online" to "Devices":
- Change label from `"Devices Online"` to `"Devices"`
- Show only the count of Daze-owned devices (not the online/total ratio)

**File: `src/hooks/useHotels.ts`**

Modify the devices query to:
- Filter for `is_daze_owned = true` only
- Return just the total count of Daze tablets (not online status)

Updated query logic:
```typescript
// Fetch only Daze-owned devices
const { data: devices } = await supabase
  .from("devices")
  .select("hotel_id")
  .eq("is_daze_owned", true);
```

Updated Hotel type:
```typescript
export type Hotel = Tables<"hotels"> & {
  hasBlocker: boolean;
  primaryContact: Tables<"hotel_contacts"> | null;
  dazeDeviceCount: number;  // Renamed from deviceCount/onlineDeviceCount
};
```

---

### Part 3: New Onboarding Step - "Devices"

#### A. Create DevicesStep Component

**New file: `src/components/portal/steps/DevicesStep.tsx`**

A new accordion step with:
- **Radio selection**: "Use Daze Tablets" vs "Use Our Own Devices"
- **Optional quantity input**: If Daze tablets selected, ask "How many tablets do you need?"
- **Confirmation state**: Summary of selection with edit capability

UI Structure:
```
┌─────────────────────────────────────────────────────────────────┐
│ E  Device Setup                                        [locked] │
│    Choose your hardware preference                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  How would you like to display the ordering system?             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📱  Use Daze Tablets                                     │  │
│  │      We'll ship pre-configured tablets ready to deploy    │  │
│  │      ○ Selected                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  💻  Use Our Own Devices                                  │  │
│  │      We'll use existing tablets or kiosks at the property │  │
│  │      ○ Not selected                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [If Daze Tablets selected:]                                    │
│  How many tablets do you need?                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [ 2 ]  tablets                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│                                    [ Confirm Selection ]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### B. Update Task Order

**File: `src/components/portal/TaskAccordion.tsx`**

Update the `TASK_ORDER` array:
```typescript
const TASK_ORDER = ["legal", "brand", "venue", "pos", "devices"];
```

Add the DevicesStep component after PosStep in the Accordion.

#### C. Update PortalPreview

**File: `src/pages/PortalPreview.tsx`**

Add the "devices" task to the mock tasks array:
```typescript
const [tasks, setTasks] = useState([
  { key: "legal", name: "Legal & Agreements", isCompleted: false, data: {} },
  { key: "brand", name: "Brand Identity", isCompleted: false, data: {} },
  { key: "venue", name: "Venue Manager", isCompleted: false, data: {} },
  { key: "pos", name: "POS Integration", isCompleted: false, data: {} },
  { key: "devices", name: "Device Setup", isCompleted: false, data: {} },
]);
```

Add handler for devices update:
```typescript
const handleDevicesUpdate = (data: { 
  use_daze_tablets: boolean; 
  tablet_count?: number 
}) => {
  // Update task state
  // Log demo activity
};
```

---

### Part 4: Data Schema for Devices Task

The `onboarding_tasks.data` JSONB field will store:

```typescript
interface DevicesTaskData {
  use_daze_tablets: boolean;
  tablet_count?: number;  // Only if use_daze_tablets is true
  confirmed_at?: string;  // ISO timestamp when selection was made
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/portal/steps/DevicesStep.tsx` | New onboarding step component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Update metric from "Devices Online" to "Devices" |
| `src/hooks/useHotels.ts` | Filter devices query to Daze-owned only |
| `src/components/portal/TaskAccordion.tsx` | Add DevicesStep, update TASK_ORDER |
| `src/components/portal/steps/index.ts` | Export new DevicesStep |
| `src/pages/PortalPreview.tsx` | Add devices task to demo |

## Database Migration Required

Add `is_daze_owned` column to the `devices` table.

---

## Visual Design Notes

### DevicesStep Card Styling
- Use the same accordion pattern as other steps
- Radio cards with icons: `Tablet` for Daze, `Monitor` for client-owned
- Ocean Blue accent (`#0EA5E9`) for selected state border
- Subtle hover lift effect matching other cards

### Dashboard Metric
- Keep the `Cpu` icon for the "Devices" stat
- Display just the count number (e.g., "5") instead of ratio

