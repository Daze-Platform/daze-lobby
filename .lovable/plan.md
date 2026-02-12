

# Compress Portal Access Content in New Client Modal

## Problem
The Portal Access (Step 3) content in the New Client modal sits too close to the right edge of the dialog, creating a cramped appearance -- especially the full URL preview row.

## Solution
Reduce the horizontal padding on the content area and footer from `px-8` (32px) to `px-6` (24px) for the entire modal, giving the inner content more breathing room relative to the container edges. This affects the header, content area, and footer uniformly so the layout remains balanced.

## Technical Details

**File: `src/components/modals/NewClientModal.tsx`**

- Line 273 (header): Change `px-8` to `px-6`
- Line 320 (content area): Change `px-8` to `px-6`  
- Line 599 (footer): Change `px-8` to `px-6`

This gives approximately 12px more horizontal space to the content on each side, preventing the slug input and full URL preview from feeling pressed against the container boundary.

Alternatively, if you prefer keeping the wider padding on steps 1 and 2, we can scope the change to only step 3's motion.div by adding a negative margin or reducing padding just for that step. But uniform `px-6` is the cleaner approach and matches standard dialog padding conventions.

