

# Resize and Reposition Daze Logo on Auth Forms

## What Changes

Make the Daze logo smaller and place it inline to the left of "Daze Lobby" text (instead of stacked above it) across all auth form headers.

## Current Layout

```text
    [  Logo (64px)  ]
      Daze Lobby
```

## New Layout

```text
  [Logo (28px)] Daze Lobby
```

## Files to Update

### 1. `src/components/auth/LoginForm.tsx` (lines 197-200)
- Change the header from `flex-col` (vertical stack) to `flex-row` (horizontal inline)
- Reduce logo size from `h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16` to `h-7 w-7 sm:h-8 sm:w-8`
- Remove bottom margin (`mb-2 sm:mb-3`) from the logo
- Add a small horizontal gap (`gap-2`) between logo and text

### 2. `src/components/auth/SignUpForm.tsx` (lines 110-113)
- Same changes: horizontal layout, smaller logo (`h-8 w-8`), remove vertical margin

### 3. `src/components/auth/ForgotPasswordForm.tsx` (lines 48-50)
- Same changes: horizontal layout, smaller logo, remove vertical margin

All three forms will use the same consistent inline logo + text pattern, matching the style already used in the DashboardHeader.
