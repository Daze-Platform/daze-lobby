

# Replace Hardcoded Mock Blockers with Live Data

## Problem
The Blockers page (`src/pages/Blockers.tsx`) contains a hardcoded `mockBlockers` array with 3 fake entries (The Riverside Hotel, Mountain View Lodge, Lakefront Inn). These will always show regardless of database state.

## Solution
Replace the mock data with a real query to the `blocker_alerts` table, joining with `clients` and `onboarding_tasks` to get the actual blocker information.

## Technical Details

### 1. Update `src/pages/Blockers.tsx`
- Remove the `mockBlockers` array and `MockBlocker` interface
- Query `blocker_alerts` table joined with `clients` to get hotel name, blocker reason, and timestamps
- Query `onboarding_tasks` to calculate completed task counts per client
- Show an empty state when no blockers exist
- Keep the existing card UI, notification dialog, and reminder functionality but wire them to real data

### 2. Use the `useSendBlockerNotification` hook
- The codebase already has this hook -- wire it into the Send Reminder flow instead of the current `setTimeout` simulation

### 3. Empty State
- When no blockers exist, show a friendly "No active blockers" message so the page isn't blank

