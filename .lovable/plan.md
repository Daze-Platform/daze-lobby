

# Fix: Modal Horizontal Padding Consistency

## Problem

The "New Client" modal has visually unequal horizontal padding -- the left side appears to have more space than the right. This is caused by the content sections (header at `p-6`, body at `p-6`, footer at `p-6`) not accounting for the close button's `right-4` positioning, creating a visual imbalance. Additionally, the inner content could benefit from slightly more generous and consistent horizontal padding.

## Solution

Increase the horizontal padding across all three sections (header, content, footer) from `p-6` to `px-8 py-6` to give more breathing room and ensure visual symmetry. This small bump from 24px to 32px horizontal padding will make the content feel properly centered and away from the close button.

## Changes

**`src/components/modals/NewClientModal.tsx`**

1. **Header** (line 267): Change `p-6 pb-4` to `px-8 pt-6 pb-4`
2. **Content body** (line 314): Change `p-6` to `px-8 py-6`
3. **Footer** (line 595): Change `p-6 pt-4` to `px-8 pb-6 pt-4`

This ensures all three horizontal sections share the same `px-8` (32px) padding on both sides, creating a perfectly symmetrical layout with enough clearance from the dialog's close button.

