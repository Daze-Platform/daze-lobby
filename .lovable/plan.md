

## Fix: Auth Card Styles Not Applying

### Root Cause

The `Input` component (`src/components/ui/input.tsx`) has these base classes:
- `border-0` -- removes all borders
- `bg-secondary/50` -- grey background fill
- `ring-1 ring-inset ring-border/50` -- faint ring instead of border

When `LoginForm` and `SignUpForm` add `bg-white border border-border` in the className prop, Tailwind does **not** guarantee that later classes override earlier ones. The base `border-0` cancels out `border`, and `bg-secondary/50` competes with `bg-white`. The result: nothing visually changes.

### Fix

Use Tailwind's `!important` modifier to ensure the overrides take effect:

**`src/components/auth/LoginForm.tsx`** (2 inputs)
- Change `bg-white border border-border` to `!bg-white !border !border-border`

**`src/components/auth/SignUpForm.tsx`** (3 inputs)
- Same change on all Input className props

This is a minimal, targeted fix -- no functional or structural changes.

