

# Fix Inconsistent "Incomplete" Stat

## Problem
The "Incomplete" stat card on the dashboard aggregates two different data sources (active blockers + pending onboarding tasks), but clicking it navigates to the Blockers page which only shows `blocker_alerts` records. This creates a mismatch: the card says 5, but the Blockers page says 0.

## Root Cause
In `src/hooks/useClients.ts`, `incompleteCount` is calculated as:
```
incompleteCount = blockerCount + pendingCount
```
Where `pendingCount` includes all incomplete onboarding tasks (which is normal work, not a problem requiring attention).

## Solution
Change `incompleteCount` to only count **active blockers** -- the items that actually appear on the Blockers page. Pending onboarding tasks are normal workflow items, not actionable "incomplete" items for the control tower.

## Changes

### `src/hooks/useClients.ts`
- Change the `incompleteCount` calculation from `blockerCount + pendingCount` to just `blockerCount`
- Remove the pending tasks query and related code since it is no longer used for this stat
- Keep `pendingTasksByClient` map only if used elsewhere; otherwise remove to reduce unnecessary database calls

### `src/pages/Dashboard.tsx`
- No changes needed -- it already reads `incompleteCount` from the client data

## Result
The "Incomplete" stat will show 0 (matching the Blockers page), and will only increase when actual `blocker_alerts` records exist.

