

## Make "No Fees" Pricing Option Visible but Unavailable

### What Changes

The "No Fees" (5.1) pricing option will remain visible in both the agreement preview text and the generated PDF, but will be visually marked as unavailable/not selectable.

Since pricing is already hardcoded to "10% Daze Revenue Share," this is purely a display change in two places:

### 1. Agreement Preview Text (`src/components/portal/ReviewSignModal.tsx`)

In the `createAgreementText` function (~line 219), update the "No Fees" line to include a visual indicator that it's unavailable:

- Change from: `${pNone} 5.1 No Fees -- No fees apply during the Pilot Term.`
- Change to: `[ ] 5.1 No Fees -- No fees apply during the Pilot Term. (Not available for Pilot)`

This ensures the checkbox is always unchecked and clearly labeled as unavailable.

### 2. Generated PDF (`src/lib/pdf/sections.ts`)

In the pricing section (~line 228-229), update the "No Fees" content block to:
- Keep the checkbox always unchecked
- Append "(Not available for Pilot)" or style the text to indicate unavailability
- Change the checked condition so it never evaluates to true regardless of data

### Files to Edit
- `src/components/portal/ReviewSignModal.tsx` -- agreement preview text
- `src/lib/pdf/sections.ts` -- PDF generation

### No Other Impact
- The pricing model is already hardcoded to `daze_rev_share` so no form logic changes are needed
- No database or schema changes required
