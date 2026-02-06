
# Fantastic Step Completion Transitions

## Overview

After the `SaveButton` shows its success state (green with checkmark), we'll create a delightful transition that:
1. Celebrates the completion with visual feedback
2. Smoothly collapses the current accordion step
3. Elegantly unlocks and highlights the next step
4. Updates the progress ring with a satisfying animation

## Animation Flow

```text
+---------------------------+
|   User clicks Save        |
+---------------------------+
            |
            v
+---------------------------+
| SaveButton: Loading       |
| (spinner + "Saving...")   |
+---------------------------+
            |
            v
+---------------------------+
| SaveButton: Success       |
| (green + checkmark, 2s)   |
+---------------------------+
            |
            v (after 1.5s delay)
+---------------------------+
| Celebration Effect        |
| (confetti/pulse on badge) |
+---------------------------+
            |
            v
+---------------------------+
| Current Step Collapses    |
| (accordion closes)        |
+---------------------------+
            |
            v
+---------------------------+
| Next Step Unlocks         |
| (glow animation + auto-   |
|  expand next accordion)   |
+---------------------------+
```

## Implementation Plan

### 1. Add New Keyframe Animations (tailwind.config.ts)

New animations to add:
- `celebrate`: A subtle pulse/scale effect for the completed step badge
- `unlock-glow`: A gentle glow animation for newly unlocked steps
- `confetti-burst`: Optional particle effect for major milestones

```text
keyframes: {
  celebrate: scale up slightly, then back with a bounce
  "unlock-glow": pulsing border/shadow glow effect
  "slide-up-fade": content slides up and fades as step closes
}
```

### 2. Create StepCompletionOverlay Component

A new component that renders a brief celebration overlay when a step completes:
- Subtle confetti particles or sparkle effects
- Quick fade in/out (500ms total)
- Positioned absolutely over the completed step

### 3. Enhance TaskAccordion with Transition Logic

**State Management:**
- Track `recentlyCompleted: string | null` - the key of the step that just completed
- Track `pendingUnlock: string | null` - the step about to be unlocked
- Use `useEffect` to orchestrate the transition timing

**Transition Timeline:**
1. `SaveButton` success state shows (0-2000ms)
2. At 1500ms: Start celebration effect
3. At 2000ms: Collapse current accordion
4. At 2200ms: Add "unlock-glow" class to next step
5. At 2400ms: Auto-expand next accordion step
6. At 3000ms: Clear all transition states

### 4. Update Individual Step Components

**Modifications to LegalStep, BrandStep, VenueStep:**
- Accept new props: `isJustCompleted`, `isUnlocking`
- Apply celebration animation class when `isJustCompleted` is true
- Apply unlock-glow animation when `isUnlocking` is true
- The step number badge gets a special "pop" animation on completion

### 5. Enhanced SaveButton with onSuccess Callback

Modify `SaveButton` to accept an optional `onSuccess` callback that fires after the save completes (but before the success state ends):
- This allows parent components to trigger the step transition
- Pass timing information so orchestration can be precise

### 6. Update ProgressRing Animation

When progress increases:
- Animate the ring with a slight overshoot (elastic easing)
- Add a brief "pulse" to the percentage number
- Optional: Particle burst at the progress endpoint

## Files to Create/Modify

| File | Changes |
|------|---------|
| `tailwind.config.ts` | Add celebrate, unlock-glow, slide-up-fade keyframes and animations |
| `src/components/ui/save-button.tsx` | Add `onSuccess` callback prop |
| `src/components/portal/TaskAccordion.tsx` | Add transition orchestration logic, track completion states, manage accordion value |
| `src/components/portal/steps/LegalStep.tsx` | Accept `isJustCompleted`, `isUnlocking` props, apply animation classes |
| `src/components/portal/steps/BrandStep.tsx` | Accept `isJustCompleted`, `isUnlocking` props, apply animation classes |
| `src/components/portal/steps/VenueStep.tsx` | Accept `isJustCompleted`, `isUnlocking` props, apply animation classes |
| `src/components/portal/StepCompletionEffect.tsx` | New component for celebration overlay |
| `src/index.css` | Add any additional utility classes for animations |

## Technical Details

### New Keyframes (tailwind.config.ts)

```ts
keyframes: {
  // Existing...
  "celebrate": {
    "0%": { transform: "scale(1)" },
    "50%": { transform: "scale(1.2)" },
    "75%": { transform: "scale(0.95)" },
    "100%": { transform: "scale(1)" }
  },
  "unlock-glow": {
    "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" },
    "50%": { boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.4)" }
  },
  "success-ring": {
    "0%": { strokeDashoffset: "var(--initial-offset)" },
    "100%": { strokeDashoffset: "var(--final-offset)" }
  }
}
```

### SaveButton Enhancement

```tsx
interface SaveButtonProps extends Omit<ButtonProps, "onClick"> {
  onClick: () => Promise<void> | void;
  onSuccess?: () => void; // New: fires when save succeeds
  // ... existing props
}
```

### TaskAccordion State

```tsx
const [accordionValue, setAccordionValue] = useState<string | undefined>();
const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null);
const [unlockingStep, setUnlockingStep] = useState<string | null>(null);

const handleStepComplete = (stepKey: string) => {
  setRecentlyCompleted(stepKey);
  
  // Orchestrate transition
  setTimeout(() => {
    setAccordionValue(undefined); // Collapse current
  }, 500);
  
  setTimeout(() => {
    const nextStep = getNextStep(stepKey);
    if (nextStep) {
      setUnlockingStep(nextStep);
      setAccordionValue(nextStep); // Open next
    }
  }, 800);
  
  setTimeout(() => {
    setRecentlyCompleted(null);
    setUnlockingStep(null);
  }, 2500);
};
```

### Step Badge Animation

```tsx
<div className={cn(
  "w-8 h-8 rounded-full flex items-center justify-center",
  isCompleted && "bg-success text-success-foreground",
  isJustCompleted && "animate-celebrate"
)}>
```

## Result

After implementation, completing each step will:
1. Show the green "Saved!" button state for 2 seconds
2. Trigger a celebration animation on the step badge (scales up with a bounce)
3. Apply a glow effect to the newly unlocked step
4. Auto-collapse the completed step
5. Auto-expand the next available step
6. Animate the progress ring smoothly to the new percentage

This creates a satisfying, game-like progression feel that rewards users for completing each onboarding task.
