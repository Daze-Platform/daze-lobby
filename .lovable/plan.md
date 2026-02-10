

# Refine Client Onboarding Portal UI

## What's Changing

Visual polish and added visual elements for the onboarding section on the Portal page -- specifically the Progress card and the Setup Tasks checklist -- without using any gradients.

## Changes

### 1. Remove All Gradients

Strip the two gradient top-bar decorations from both the Progress card and the Checklist card, plus the radial background glow. Replace with clean, solid-color accents that align with the Daze brand.

- **Progress Card**: Replace the gradient bar with a solid 2px `border-t border-primary` top accent
- **Checklist Card**: Remove the gradient bar entirely for a cleaner look

### 2. Progress Card Refinements

- Add a subtle icon next to the "Progress" micro-label (e.g., a `TrendingUp` or `Target` icon) for visual interest
- Improve spacing between the progress ring, status badge, and tasks counter
- Add a light divider between the status badge and the counter for clearer visual grouping
- Give the card a slightly elevated shadow to create hierarchy against the task list

### 3. Checklist Card Refinements

- Add step numbers (1-5) alongside the progress pills in the header for clearer context
- Add a motivational micro-copy line below the title that changes based on progress (e.g., "Let's get started" at 0%, "You're making progress" mid-way, "Almost there!" near completion)
- Improve the card header spacing and alignment

### 4. Welcome Section Polish

- Add a subtle waving hand emoji or small icon next to the partner name for warmth
- Tighten the spacing between heading and subtext for a more compact, editorial feel

## Technical Details

### Files Modified

**`src/pages/Portal.tsx`**
- Remove the two gradient `<div>` elements (lines 226 and 262)
- Remove the radial glow `<div>` (line 229)
- Add `border-t-2 border-primary` to the Progress card className
- Add a `shadow-sm` or custom elevation class to the Progress card for hierarchy
- Add a dynamic motivational message in the Checklist card header based on `progress` value
- Add step count labels next to the progress pills
- Minor spacing refinements throughout

All changes are confined to `src/pages/Portal.tsx`. No new dependencies or components required.

