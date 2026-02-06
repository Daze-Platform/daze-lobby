
# Launch Celebration Feature

This plan implements a celebratory confetti animation when the status transitions to "Live" and updates the Progress Ring text from "Ready for Takeoff" to "Launched" with a rocket illustration.

## Overview

When a client completes their onboarding journey and the status changes to "Live", they will experience:
1. A dramatic confetti explosion that fills the screen
2. The Progress Ring center text changes from "Ready for Takeoff" to "Launched"  
3. A rocket icon animates into view next to the "Launched" text

```text
+---------------------------+
|    BEFORE (Onboarding)    |
|                           |
|         100%              |
|    Ready for Takeoff      |
|                           |
+---------------------------+

+---------------------------+
|     AFTER (Live)          |
|   * * CONFETTI * *        |
|         100%              |
|    Launched               |
+---------------------------+
```

## Implementation Steps

### Step 1: Install Confetti Library

Add the `canvas-confetti` package which provides lightweight, performant confetti animations with TypeScript support.

### Step 2: Create Confetti Component

Build a reusable `ConfettiCelebration` component that:
- Accepts a `trigger` prop to fire the animation
- Uses a full-screen canvas positioned absolutely
- Fires a multi-burst confetti sequence (left side, right side, then center shower)
- Auto-cleans up after animation completes

**Location:** `src/components/portal/ConfettiCelebration.tsx`

### Step 3: Update Progress Ring

Modify `ProgressRing` to display context-aware messaging:

| Status | Text | Icon |
|--------|------|------|
| Onboarding/Reviewing | "Ready for Takeoff" | None |
| Live | "Launched" | Rocket icon with bounce animation |

**Changes to:** `src/components/portal/ProgressRing.tsx`
- Add `status` prop to component interface
- Conditionally render text and icon based on status
- Add rocket icon animation using existing spring physics

### Step 4: Wire Up Celebration Trigger

**Portal Preview Page (`src/pages/PortalPreview.tsx`):**
- Track previous status to detect transitions
- When status changes from any state to "live", trigger confetti
- Pass status prop to ProgressRing

**Portal Page (`src/pages/Portal.tsx`):**
- Apply same logic for authenticated portal
- Pass status prop to ProgressRing

### Step 5: Add Rocket Animation Keyframes

Add a new `rocket-launch` animation to the CSS that gives the rocket icon a satisfying entrance with the existing spring physics system.

**Location:** `src/index.css`

---

## Technical Details

### Confetti Animation Sequence

```text
Timeline (ms):
0ms    - Left burst (origin: bottom-left, angle: 60°)
150ms  - Right burst (origin: bottom-right, angle: 120°)
300ms  - Center shower (origin: top-center, gravity: 1.2)
```

### Component Props

```typescript
// ProgressRing updated interface
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  status?: "onboarding" | "reviewing" | "live";
  className?: string;
}

// ConfettiCelebration interface
interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}
```

### Files to Create
- `src/components/portal/ConfettiCelebration.tsx`

### Files to Modify
- `src/components/portal/ProgressRing.tsx` - Add status awareness and rocket icon
- `src/pages/PortalPreview.tsx` - Trigger confetti on live transition
- `src/pages/Portal.tsx` - Pass status to ProgressRing
- `src/index.css` - Add rocket animation keyframes

### Dependencies to Add
- `canvas-confetti` - Lightweight confetti animation library with TypeScript types
