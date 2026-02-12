

# Fix: Remove "(Not available for Pilot)" from Section 5.1

## Summary

After a complete line-by-line comparison of the uploaded official Pilot Agreement PDF against the code, the agreement is nearly a perfect match. Only one text discrepancy was found.

## Discrepancy Found

**Section 5.1 No Fees** contains extra text not present in the official PDF:

- Official PDF: "No fees apply during the Pilot Term."
- Code: "No fees apply during the Pilot Term. **(Not available for Pilot)**"

The parenthetical "(Not available for Pilot)" does not appear in the official document and must be removed from both locations.

## Changes

### 1. `src/components/portal/ReviewSignModal.tsx` (line ~219)

Remove "(Not available for Pilot)" from the Section 5.1 No Fees line in the `createAgreementText` function.

**Before:** `[ ] 5.1 No Fees — No fees apply during the Pilot Term. (Not available for Pilot)`
**After:** `[ ] 5.1 No Fees — No fees apply during the Pilot Term.`

### 2. `src/lib/pdf/sections.ts` (line 229)

Remove "(Not available for Pilot)" from the checkbox text for Section 5.1 in the generated PDF.

**Before:** `{ type: "checkbox", checked: false, text: "No fees apply during the Pilot Term. (Not available for Pilot)" }`
**After:** `{ type: "checkbox", checked: false, text: "No fees apply during the Pilot Term." }`

## Verification

All other sections (1-13), including all bullet points, label-value fields, legal clauses, and the signature block, are identical to the official PDF. No other changes are needed.

