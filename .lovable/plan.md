
# Add TEST DATA Badge and Purge & Reseed Functionality

## Overview
This plan adds two features to help distinguish test environments and manage demo data:
1. A "TEST DATA" badge visible in non-production environments
2. A Settings dialog with a "Purge & Reseed" button for wiping and regenerating demo data

---

## 1. Environment Detection

Create a utility to detect if the app is running in production or test mode.

**File:** `src/lib/environment.ts` (new)

Uses the preview URL pattern to detect environment:
- Production: Published URL (e.g., `*.lovable.app` without `-preview--`)
- Test: Preview URL or localhost

---

## 2. TEST DATA Badge in Header

Add a prominent badge in the top-right area of the dashboard header when not in production.

**File:** `src/components/layout/DashboardHeader.tsx`

Changes:
- Import the environment utility
- Add a conditionally-rendered badge with amber/yellow styling before the user dropdown
- Badge text: "TEST DATA"

---

## 3. Settings Dialog Component

Create a new Settings dialog that opens when clicking "Settings" in the user dropdown.

**File:** `src/components/settings/SettingsDialog.tsx` (new)

Features:
- Modal dialog with tabs or sections
- "Data Management" section containing the Purge & Reseed button
- Admin-only access for destructive operations

---

## 4. Purge & Reseed Hook

Create a custom hook to handle the purge and reseed operations.

**File:** `src/hooks/usePurgeAndReseed.ts` (new)

Operations (in order due to foreign key constraints):
1. Delete from `activity_logs`
2. Delete from `blocker_alerts`
3. Delete from `devices`
4. Delete from `hotel_contacts`
5. Delete from `hotels`
6. Insert 10 new hotels with realistic data
7. Insert associated contacts, devices, and blocker alerts

The seed data will include:
- **3 Onboarding hotels**: The Pearl Hotel, Seaside Resort, Mountain View Lodge (one stalled 18+ days)
- **4 Pilot Live hotels**: Urban Boutique, The Riverside, Lakefront Inn, City Center Hotel (one with blocker alert)
- **3 Contracted hotels**: Royal Plaza, Grand Metropolitan, The Landmark (healthy MRR figures)

---

## 5. Wire Up Settings Menu Item

Update the header to open the Settings dialog when clicking the Settings menu item.

**File:** `src/components/layout/DashboardHeader.tsx`

Changes:
- Add state for dialog open/close
- Import and render SettingsDialog component
- Connect menu item click to open the dialog

---

## 6. Confirmation Dialog for Purge

Add a confirmation step before purging to prevent accidental data loss.

Uses the existing AlertDialog component for the confirmation.

---

## Files to Create
1. `src/lib/environment.ts` - Environment detection utility
2. `src/components/settings/SettingsDialog.tsx` - Settings modal with Purge & Reseed
3. `src/hooks/usePurgeAndReseed.ts` - Data management hook

## Files to Modify
1. `src/components/layout/DashboardHeader.tsx` - Add TEST DATA badge and wire up Settings dialog

---

## Technical Details

### Environment Detection Logic
```text
const isProduction = () => {
  const hostname = window.location.hostname;
  return hostname.endsWith('.lovable.app') && 
         !hostname.includes('-preview--');
};
```

### Seed Data Structure
```text
Hotels Distribution:
+------------------+-------------+------------------+
| Onboarding (3)   | Pilot (4)   | Contracted (3)   |
+------------------+-------------+------------------+
| The Pearl        | Urban       | Royal Plaza      |
| Seaside Resort   | Riverside*  | Grand Metro      |
| Mountain View**  | Lakefront   | The Landmark     |
|                  | City Center |                  |
+------------------+-------------+------------------+
* Has blocker alert (low orders)
** Stalled (created 18 days ago)
```

### Purge Order (respects foreign keys)
```text
1. activity_logs (depends on hotels)
2. blocker_alerts (depends on hotels)
3. devices (depends on hotels)
4. hotel_contacts (depends on hotels)
5. hotels (parent table)
```
