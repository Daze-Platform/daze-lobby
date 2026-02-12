

# Fix "Sign Agreement" Button Text Overflow

## Problem
The "Sign Agreement" button text and icon are not properly contained within the button on larger screens. The `lg:w-[120px]` constraint on the action buttons column is too narrow to fit the checkmark icon plus "Sign Agreement" text.

## Solution
Widen the action buttons column and ensure text does not wrap or overflow.

## Technical Changes

### `src/components/portal/ReviewSignModal.tsx`

**Line 904** -- Increase the column width from `lg:w-[120px]` to `lg:w-[160px]` to accommodate the full button text:
```
lg:w-[120px]  -->  lg:w-[160px]
```

**Line 917** -- Add `whitespace-nowrap` to the Sign Agreement button to prevent text wrapping:
```
className="flex-[2] lg:flex-none gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm whitespace-nowrap"
```

These two small changes ensure the button text stays on one line and the column is wide enough to contain it.
