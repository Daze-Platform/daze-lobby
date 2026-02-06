
# Refine Task Checklist Badges (A, B, C)

## Current State
The step badges (A, B, C) are currently styled as:
- Basic squircle containers with `bg-card text-muted-foreground`
- Simple green checkmark when complete
- Identical styling across all three steps
- No visual distinction between pending, active, and locked states

**Current code pattern (duplicated in each step):**
```tsx
<div className={cn(
  "w-7 h-7 md:w-8 md:h-8 rounded-[8px] md:rounded-[10px] flex items-center justify-center text-xs md:text-sm font-medium transition-all duration-300 shadow-sm",
  isCompleted ? "bg-success text-success-foreground" : "bg-card text-muted-foreground"
)}>
  {isCompleted ? <Check /> : "A"}
</div>
```

---

## Proposed Refinements

### Visual Enhancements

| State | Current | Proposed |
|-------|---------|----------|
| **Pending** | Gray bg, gray text | Subtle gradient border ring, refined typography |
| **Active** | Same as pending | Ocean Blue ring glow, elevated shadow |
| **Complete** | Green bg + checkmark | Emerald Green with soft glow, animated check |
| **Locked** | Same as pending | Muted with lock icon, reduced opacity |

### Design Details

1. **Premium Typography**
   - Use `font-display` (Plus Jakarta Sans) for the letters
   - Slightly larger letter size for better readability
   - Tighter tracking for the monospace look

2. **Gradient Border Effect**
   - Pending steps get a subtle inner shadow creating depth
   - Active step gets an Ocean Blue ring that pulses gently

3. **Success State Refinement**
   - Emerald Green background with soft outer glow
   - Checkmark icon with "pop" animation on completion
   - Subtle shadow for depth

4. **Locked State**
   - Show lock icon instead of letter
   - Reduced opacity (50%)
   - Muted background

5. **Squircle Refinement**
   - Increase border-radius slightly for softer appearance
   - Add inner shadow for "inset" premium feel

---

## Technical Implementation

### File: `src/components/ui/step-badge.tsx` (New)
Create a dedicated, reusable `StepBadge` component that encapsulates all badge states:

```tsx
interface StepBadgeProps {
  step: "A" | "B" | "C";
  status: "pending" | "active" | "complete" | "locked";
  isJustCompleted?: boolean;
}
```

### Files to Update:
1. **`src/components/portal/steps/LegalStep.tsx`** - Replace inline badge with `<StepBadge step="A" />`
2. **`src/components/portal/steps/BrandStep.tsx`** - Replace inline badge with `<StepBadge step="B" />`
3. **`src/components/portal/steps/VenueStep.tsx`** - Replace inline badge with `<StepBadge step="C" />`

### CSS Additions (`src/index.css`):
- Add `@keyframes badge-glow` for the active state pulse
- Add `badge-inset` utility class for the premium inner shadow

---

## Visual Preview

```text
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌──────┐                                          │
│  │  A   │  Legal & Agreements         [Pending]   │
│  └──────┘  Review and sign required agreements    │
│   ▲ Soft shadow, refined typography               │
│                                                    │
│  ┌──────┐                                          │
│  │  ✓   │  Brand Identity            [Complete]   │
│  └──────┘  Emerald green with glow                │
│   ▲ Pop animation, success glow                   │
│                                                    │
│  ┌──────┐                                          │
│  │  🔒  │  Venue Manager              [Locked]    │
│  └──────┘  Muted, reduced opacity                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Implementation Steps

1. Create `src/components/ui/step-badge.tsx` with all state variants
2. Add CSS keyframes for the active glow pulse animation
3. Update `LegalStep.tsx` to use the new component
4. Update `BrandStep.tsx` to use the new component  
5. Update `VenueStep.tsx` to use the new component
6. Add proper status logic based on `isCompleted`, `isLocked`, and accordion open state
