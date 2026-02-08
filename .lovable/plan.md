
# Bell Icon Enhancement Plan

## Overview
This plan updates the notification bell icon on client cards to:
1. Only show when there are **pending tasks** (incomplete onboarding items)
2. Display in **green** when a reminder has already been sent, otherwise **amber**

## Implementation Steps

### 1. Update the `useClients` Hook

**File:** `src/hooks/useClients.ts`

Add a query to check for the most recent `blocker_notification` in `activity_logs` per client:

```typescript
// Fetch latest blocker notifications per client
const { data: notifications, error: notificationsError } = await supabase
  .from("activity_logs")
  .select("client_id, created_at")
  .eq("action", "blocker_notification")
  .order("created_at", { ascending: false });

// Track clients with recent notifications (e.g., within last 24-48 hours)
const recentNotificationsByClient = new Map<string, Date>();
notifications?.forEach((n) => {
  if (!recentNotificationsByClient.has(n.client_id)) {
    recentNotificationsByClient.set(n.client_id, new Date(n.created_at));
  }
});
```

Update the `Client` type to include:
```typescript
export type Client = Tables<"clients"> & {
  // ... existing fields
  hasPendingTasks: boolean;      // True if incompleteCount > 0
  hasRecentReminder: boolean;    // True if a reminder was sent recently
  lastReminderAt: Date | null;   // Timestamp of last reminder
};
```

### 2. Update Client Cards UI

**File:** `src/pages/Clients.tsx`

Change the visibility condition from `client.hasBlocker` to `client.incompleteCount > 0`:

```typescript
{/* Notify Button - Only show when there are pending tasks */}
{client.incompleteCount > 0 && (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            client.hasRecentReminder
              ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              : "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          )}
          onClick={(e) => handleNotifyClick(e, client)}
        >
          <Bell className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{client.hasRecentReminder ? "Reminder already sent" : "Send reminder to client"}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

### 3. Tooltip Feedback

The tooltip will dynamically show:
- **Amber bell**: "Send reminder to client"
- **Green bell**: "Reminder already sent" (with optional: click to send another)

## Data Flow

```text
activity_logs table
      |
      v
useClients hook fetches latest "blocker_notification" per client
      |
      v
Sets hasRecentReminder = true if notification exists (optionally within X hours)
      |
      v
Clients.tsx renders:
  - Bell visible when incompleteCount > 0
  - Bell is green when hasRecentReminder = true
  - Bell is amber when hasRecentReminder = false
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useClients.ts` | Add notification query, update Client type with `hasRecentReminder` |
| `src/pages/Clients.tsx` | Update bell visibility condition and dynamic styling |

## Technical Details

### Reminder Freshness (Optional Enhancement)
Consider a reminder "recent" if sent within the last 24 hours to allow re-sending after a day:
```typescript
const REMINDER_FRESHNESS_MS = 24 * 60 * 60 * 1000; // 24 hours
const isRecent = lastReminderAt && 
  (now.getTime() - lastReminderAt.getTime()) < REMINDER_FRESHNESS_MS;
```

For the initial implementation, we'll treat any notification as "recent" (always green after sending).
