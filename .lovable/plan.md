
# Add Mock Data to Client Detail Panel Tabs

Replace the "coming soon" placeholders with functional mock data displays for the Contacts, Devices, and Activity tabs in the client detail sidebar.

## Overview

The `HotelDetailPanel` currently shows placeholder messages for three tabs. We'll populate them with hardcoded mock data that mimics real data structures, making it easy to swap to real database queries later.

## Files to Modify

### 1. HotelDetailPanel.tsx

Update the component to include inline mock data and render proper UI for each tab:

**Contacts Tab:**
- Display a list of 2-3 mock contacts per client
- Show name, role, email, phone with appropriate icons
- Highlight the primary contact with a badge
- Use Avatar components with initials

**Devices Tab:**
- Show 2-4 mock devices with status indicators
- Display device type, serial number, and last check-in time
- Use color-coded status badges (online/offline/pending)
- Show Daze-owned vs property-owned distinction

**Activity Tab:**
- Render 5-8 mock activity log entries
- Display user avatars, action descriptions, and timestamps
- Use the same styling patterns as the existing ActivityFeedPanel
- Show variety of actions (uploads, completions, updates)

## Mock Data Structure

```text
Contacts:
+------------------+---------------+--------------------+
| Name             | Role          | Contact Info       |
+------------------+---------------+--------------------+
| Sarah Johnson    | GM (Primary)  | sarah@example.com  |
| Mike Chen        | IT Director   | mike@example.com   |
| Lisa Rodriguez   | F&B Manager   | lisa@example.com   |
+------------------+---------------+--------------------+

Devices:
+-------------+---------------+--------+---------------+
| Type        | Serial        | Status | Last Check-in |
+-------------+---------------+--------+---------------+
| iPad Pro    | DZ-2024-001   | Online | 5 min ago     |
| iPad Air    | DZ-2024-002   | Online | 12 min ago    |
| Surface Go  | PROP-SG-001   | Offline| 2 days ago    |
+-------------+---------------+--------+---------------+

Activity:
Timeline of recent actions with avatars and timestamps
```

## UI Components Used

- Avatar with initials and fallback colors
- Badge for status indicators and role labels
- Card-like rows with hover states
- Muted icons from lucide-react
- Relative timestamps using date-fns

## Technical Notes

- All mock data is inline (no new files needed)
- Mock data uses the same field names as database schema
- Easy migration path: replace mock arrays with hooks like `useClientContacts(clientId)`
- Responsive design maintained with existing patterns
