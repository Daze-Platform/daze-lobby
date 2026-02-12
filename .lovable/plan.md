

# Add Onboarding Timeline to Progress Card

## Problem
The progress card has significant empty space below the status badge and divider. Currently it shows a single "Next up: ..." line which feels sparse.

## Solution
Replace the "Next up" text with a compact **vertical timeline** showing key onboarding dates. This gives the client a sense of momentum and timeline awareness.

```text
  +--------------------------------+
  |  Progress Ring (existing)      |
  |  Status Badge (existing)       |
  |  ----------------------------  |
  |                                |
  |  o  Started                    |
  |  |  Feb 10, 2026               |
  |  |                             |
  |  o  Next Milestone             |
  |  |  Device Setup - Mar 1       |
  |  |                             |
  |  o  Target Launch              |
  |     TBD                        |
  |                                |
  +--------------------------------+
```

- **Started**: The client's `created_at` date (when the admin created them)
- **Next Milestone**: The `next_milestone` + `next_milestone_date` fields (admin-set via dashboard)
- **Target Launch**: Derived from phase -- shows "In Review" when reviewing, "Live!" when launched, or "TBD" when still onboarding

If all tasks are complete, the timeline reflects that with a "Submitted for review" label on the final node.

## Technical Changes

### 1. Update `Client` interface in `src/contexts/ClientContext.tsx`

Add three fields to the `Client` interface and all three select queries:
- `created_at: string`
- `next_milestone: string | null`
- `next_milestone_date: string | null`

### 2. Update `src/pages/Portal.tsx` (lines 276-282)

Replace the simple "Next up" text block with a vertical timeline using three nodes:

- Each node is a flex row with a dot/line connector and label + date
- Dot styling: completed nodes get `bg-success`, current gets `bg-primary`, future gets `bg-muted-foreground/30`
- Connecting lines use a thin vertical border between dots
- Dates formatted with `date-fns` `format()` (already a dependency)
- Falls back gracefully: if `next_milestone` is null, that row shows "Not set yet"; if `created_at` is unavailable, shows "In progress"

No new components or dependencies needed. Uses existing `client` object from `useClient()` and `date-fns` for formatting.

### Files Modified
- **`src/contexts/ClientContext.tsx`**: Add `created_at`, `next_milestone`, `next_milestone_date` to the Client interface and all three select queries
- **`src/pages/Portal.tsx`**: Replace lines 276-282 with the vertical timeline markup

