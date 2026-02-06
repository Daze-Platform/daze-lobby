

# Add Dynamic Stats to Dashboard

## Overview
The dashboard currently shows hardcoded placeholder stats ("0" values) but there's real data in the database ready to display. We'll make the stats cards dynamic by computing values from the existing `useHotels` hook data.

---

## Current State
- **Stats Cards**: Hardcoded to show "0" for all metrics
- **Database Data**: 10 hotels, 1 active blocker, 9/11 devices online, $156,000 total ARR
- **Existing Hook**: `useHotels` already fetches hotels with `hasBlocker`, `deviceCount`, and `onlineDeviceCount`

---

## Implementation Approach

### Option A: Use Existing `useHotels` Hook (Recommended)
Compute stats directly from the already-fetched hotel data in `KanbanBoard`.

**Pros:**
- No additional API calls
- Data stays in sync with Kanban board
- Single source of truth

### Option B: Create Dedicated `useDashboardStats` Hook
Separate query optimized for stats aggregation.

**Pros:**
- Independent loading state
- Could use database aggregation functions

**Recommendation:** Option A - reuse existing data for simplicity and performance.

---

## Technical Details

### File: `src/pages/Dashboard.tsx`

**Changes:**
1. Import and call `useHotels()` hook
2. Compute stats from returned hotel data:
   - **Total Hotels**: `hotels.length`
   - **Active Blockers**: Count hotels where `hasBlocker === true`
   - **Devices Online**: Sum of `onlineDeviceCount` across all hotels
   - **Total ARR**: Sum of `arr` field (format with `$` and commas)

3. Add loading skeleton state for stats cards
4. Show actual values with subtle change indicators (optional)

### Code Structure

```tsx
const { data: hotels, isLoading } = useHotels();

const stats = useMemo(() => {
  if (!hotels) return defaultStats;
  
  return [
    { 
      label: "Total Hotels", 
      value: hotels.length.toString(),
      icon: Building2 
    },
    { 
      label: "Active Blockers", 
      value: hotels.filter(h => h.hasBlocker).length.toString(),
      icon: AlertTriangle 
    },
    { 
      label: "Devices Online", 
      value: hotels.reduce((sum, h) => sum + h.onlineDeviceCount, 0).toString(),
      icon: Cpu 
    },
    { 
      label: "Total ARR", 
      value: formatCurrency(hotels.reduce((sum, h) => sum + (h.arr || 0), 0)),
      icon: TrendingUp 
    },
  ];
}, [hotels]);
```

### Currency Formatting
Add a helper function to format ARR values:
```tsx
const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};
```

---

## Expected Results

| Stat | Current | After Implementation |
|------|---------|---------------------|
| Total Hotels | 0 | 10 |
| Active Blockers | 0 | 1 |
| Devices Online | 0 | 9 |
| Total ARR | $0 | $156K |

---

## Additional Enhancements (Optional)

1. **Loading Skeletons**: Pulse animation on stat cards while loading
2. **Real-time Updates**: Stats auto-update when Kanban changes (already works via shared query cache)
3. **Change Indicators**: Show "+2" or "-1" badges for recent changes

