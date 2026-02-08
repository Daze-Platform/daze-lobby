
# Blocker Notification System Implementation Plan

## Overview
This plan implements a blocker notification system that allows admin users to send notifications to clients about active blockers directly from the client cards in the dashboard. These notifications will appear in the client portal's activity feed with a visual badge indicating unread notifications.

## Architecture

### Data Flow
```text
+------------------------+        +------------------+        +------------------------+
|   Admin Dashboard      |        |    Database      |        |    Client Portal       |
|   (Clients Page)       |------->|  activity_logs   |------->|   (Activity Feed)      |
|                        |        |                  |        |                        |
|  [Notify Button] ------+        |  action:         |        |  Badge shows unread    |
|  on blocked cards      |        |  "blocker_notify"|        |  notification count    |
+------------------------+        +------------------+        +------------------------+
```

## Implementation Steps

### 1. Create a New Hook: `useSendBlockerNotification`

**File:** `src/hooks/useSendBlockerNotification.ts`

This mutation hook will:
- Accept client ID, blocker reason, and optional message
- Insert a new activity log with action type `blocker_notification`
- Include details like blocker reason and sender name
- Invalidate relevant query caches

### 2. Create a Hook: `useUnreadNotificationCount`

**File:** `src/hooks/useUnreadNotificationCount.ts`

This query hook will:
- Count activity logs where `action = 'blocker_notification'`
- Filter by client ID and check for logs newer than the last viewed timestamp
- Use localStorage to track the last viewed time per client
- Return the unread count for badge display

### 3. Update Client Cards on Clients Page

**File:** `src/pages/Clients.tsx`

Add to each client card with an active blocker:
- A bell icon button that appears when `client.hasBlocker` is true
- Clicking the button opens a confirmation dialog
- On confirm, sends the blocker notification to the client's activity feed
- Visual feedback with toast notification on success

### 4. Update Activity Feed Panel

**File:** `src/components/portal/ActivityFeedPanel.tsx`

Add support for the new `blocker_notification` action type:
- Add icon and color configuration (Bell icon, destructive/warning color)
- Format the action text appropriately (e.g., "Daze flagged a blocker: [reason]")
- Mark notifications as read when the panel is opened

### 5. Update Portal Header with Notification Badge

**File:** `src/components/portal/PortalHeader.tsx`

Add a notification badge to the Activity Feed button:
- Fetch unread notification count using the new hook
- Display a red badge with count on the Clock icon when > 0
- Badge should be visible on both desktop and mobile views

### 6. Update Portal Page to Pass Notification State

**File:** `src/pages/Portal.tsx`

- Integrate the `useUnreadNotificationCount` hook
- Pass the unread count to `PortalHeader`
- Clear unread status when activity feed is opened

### 7. Update Demo Activity Feed Panel for Preview Parity

**File:** `src/pages/PortalPreview.tsx`

- Add demo blocker notification to initial activities
- Ensure badge appears in preview mode as well

## Component Details

### Notify Button on Client Card
```
Location: Within Card component for each blocked client
Appearance: Ghost button with Bell icon
Tooltip: "Notify client about blocker"
Action: Opens a small confirmation popover/dialog
```

### Notification Badge
```
Location: On the Clock icon (Activity Feed button) in PortalHeader
Appearance: Small red circular badge with white number
Position: Top-right corner of the icon
Animation: Subtle pulse on new notification
```

### Activity Log Entry
```json
{
  "client_id": "uuid",
  "user_id": "admin-user-uuid",
  "action": "blocker_notification",
  "details": {
    "blocker_reason": "Pilot Agreement not signed",
    "message": "Please complete the legal step to proceed",
    "sent_by": "Admin Name"
  },
  "is_auto_logged": false
}
```

## Technical Details

### New Activity Action Type Configuration
Add to `getActionConfig` in ActivityFeedPanel:
```typescript
blocker_notification: { 
  icon: Bell, 
  color: "text-amber-500", 
  bgColor: "bg-amber-500/10" 
}
```

### New Activity Action Text
Add to `formatAction` in ActivityFeedPanel:
```typescript
blocker_notification: `sent a notification: "${details?.message || details?.blocker_reason || 'Action required'}"`
```

### LocalStorage Key for Read Status
```typescript
`daze-last-activity-view-${clientId}`
```

## Files to Create
1. `src/hooks/useSendBlockerNotification.ts`
2. `src/hooks/useUnreadNotificationCount.ts`

## Files to Modify
1. `src/pages/Clients.tsx` - Add notify button to blocked client cards
2. `src/components/portal/ActivityFeedPanel.tsx` - Add blocker_notification action config
3. `src/components/portal/PortalHeader.tsx` - Add notification badge
4. `src/pages/Portal.tsx` - Integrate unread notification count
5. `src/pages/PortalPreview.tsx` - Add demo notification for parity
6. `src/components/portal/DemoActivityFeedPanel.tsx` - Add demo notification support

## UX Flow

### Admin Flow
1. Admin views Clients list
2. Sees a blocked client card with a bell icon button
3. Clicks the bell icon
4. Confirmation popover appears: "Notify [Client Name] about this blocker?"
5. Optional: Add custom message field
6. Clicks "Send Notification"
7. Toast: "Notification sent to [Client Name]"

### Client Flow
1. Client logs into their portal
2. Sees a red badge on the Activity feed button showing "1" (or count)
3. Clicks to open Activity Feed panel
4. Sees notification: "Daze sent a notification: [reason/message]"
5. Badge clears after viewing
