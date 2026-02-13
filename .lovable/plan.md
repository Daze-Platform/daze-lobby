

## Cap Pilot Term Days Input to 90

### Problem
The "Pilot Term (days)" input in the Legal step accepts any number (e.g., 200), which shouldn't be allowed. It needs a maximum of 90 days.

### Changes

**File: `src/components/portal/ReviewSignModal.tsx`** (line 721)
- Add `max="90"` to the existing `<Input type="number">` element
- Add an `onChange` handler that clamps values: if the user types a number greater than 90, it gets capped to 90
- Keep `min="1"` as-is

The updated input will look like:
```tsx
<Input
  type="number"
  min="1"
  max="90"
  placeholder="90"
  value={pilotTermDays}
  onChange={e => {
    const val = e.target.value;
    if (val === "") { setPilotTermDays(""); return; }
    const num = parseInt(val, 10);
    if (!isNaN(num)) setPilotTermDays(String(Math.min(num, 90)));
  }}
  className="h-8 sm:h-9 text-xs sm:text-sm"
/>
```

| File | Change |
|------|--------|
| `src/components/portal/ReviewSignModal.tsx` | Add `max="90"` and clamp logic to pilot term days input |

