
# Fix Portal Header Admin Switcher - Duplicate Badge Issue

## Problem Identified

The "Pilot Live" badge appears twice in the header:
1. **Inside the dropdown trigger** - The SelectValue displays content from SelectItem, which includes the phase badge
2. **Outside the dropdown** - A separate Badge component shows the same phase information

This creates a cluttered, unprofessional appearance where badges overlap and duplicate information.

## Root Cause

In `AdminHotelSwitcher.tsx`:
- Lines 66-79: Each `SelectItem` renders the client name + percentage + phase badge
- When selected, the `SelectValue` inherits this full content including the badge
- Lines 92-98: A separate standalone Badge is rendered showing the same phase

## Solution

Redesign the AdminHotelSwitcher for a cleaner, more professional layout:

### Option A: Simplified Trigger, Rich Dropdown (Recommended)

**Trigger displays:**
- Hotel icon + Client name only (no badge in trigger)

**Dropdown items display:**
- Client name + progress % + phase badge (rich detail for selection)

**External summary displays:**
- Phase badge + Progress bar + percentage (after the dropdown)

### Changes to AdminHotelSwitcher.tsx

1. **Simplify SelectTrigger content** - Only show icon + client name
2. **Keep SelectItem content rich** - Name + progress + badge for easy selection
3. **Keep external progress indicator** - But ensure no duplication with trigger

## Technical Changes

```text
Before (lines 58-62):
<SelectTrigger className="w-[160px] lg:w-[200px] ...">
  <div className="flex items-center gap-2 min-w-0">
    <Building2 ... />
    <SelectValue placeholder="Select client..." />  // Shows full item content
  </div>
</SelectTrigger>

After:
<SelectTrigger className="w-[140px] lg:w-[180px] ...">
  <div className="flex items-center gap-2 min-w-0">
    <Building2 ... />
    <span className="truncate">{selectedClient?.name || "Select..."}</span>
  </div>
</SelectTrigger>
```

This prevents the SelectValue from inheriting the full SelectItem content (which includes the badge).

## Visual Layout After Fix

```text
[🏨 Royal Plaza ▼] | Pilot Live | ↗ ████ 100% | (clock) | email | Sign Out
     ^                    ^              ^
   Dropdown          Phase badge    Progress bar
   (name only)      (single instance) (no duplication)
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/portal/AdminHotelSwitcher.tsx` | Simplify trigger, use custom value display instead of SelectValue |

## Additional Refinements

1. Reduce trigger width since we're showing less content
2. Add better spacing between elements
3. Ensure the progress bar and badge have consistent alignment
4. Adjust responsive breakpoints for cleaner collapse on smaller screens
