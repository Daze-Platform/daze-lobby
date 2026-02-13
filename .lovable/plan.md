

## Remove "No Fees" Option from Pilot Agreement

The pricing model is already hardcoded to "Daze Revenue Share (10%)" -- clients cannot select "No Fees." However, Section 5.1 "No Fees" still appears as a visible (unchecked) line item in both the agreement preview and the generated PDF. This plan removes it from all locations.

### Changes

**1. `src/components/portal/ReviewSignModal.tsx` (~line 213-215)**
- Remove the `[ ] 5.1 No Fees` line and the `pNone` variable (line 103) from the agreement preview text
- Renumber sections: 5.2 becomes 5.1, 5.3 becomes 5.2, 5.4 becomes 5.3

**2. `src/lib/pdf/sections.ts` (~lines 221-225)**
- Remove the `5.1 No Fees` sub-heading and its checkbox content block
- Renumber the remaining pricing sections in the PDF to match

**3. `src/types/pilotAgreement.ts`**
- Remove `"none"` from the `pricing_model` union type so it reads: `"subscription" | "daze_rev_share" | "client_rev_share"`

### What stays the same
- The pricing is still hardcoded to `daze_rev_share` with amount `10` -- no form UI changes needed
- All other agreement sections remain untouched
