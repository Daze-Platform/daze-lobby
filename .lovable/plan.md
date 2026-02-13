

## Fix Section 5.1 Text to Match Official PDF

Only one content discrepancy was found between the uploaded PDF and the digital version.

### The Issue

Section 5.1 (No Fees) uses different wording:
- **Official PDF**: "No fees apply during the Pilot Term."
- **Current digital version**: "Not applicable during this Pilot."

### Fix

Update the 5.1 checkbox text in both files to match the PDF exactly:

| File | Line | Change |
|------|------|--------|
| `src/components/portal/ReviewSignModal.tsx` | ~214 | Change `"Not applicable during this Pilot."` to `"No fees apply during the Pilot Term."` |
| `src/lib/pdf/sections.ts` | ~227 | Change `"Not applicable during this Pilot."` to `"No fees apply during the Pilot Term."` |

### Already Verified as Matching

All other sections (1 through 13, including subsections 2.1-2.4, 4.1-4.3, 5.2-5.5, 6.1-6.3, 8.1-8.8, 13.1-13.10) are verbatim matches between the PDF and the digital version. The Section 9 survival clause, Section 5 numbering, and all legal language are already aligned.

### Intentional Differences (No Changes Needed)

- **Section 2.3**: Tablet/mount quantity fields omitted from the digital form (per your requirement for binary-only hardware choice)
- **Signature block**: "IN WITNESS WHEREOF" table replaced by the interactive digital signature pad UI
- **Pricing locked**: Sections 5.1 and 5.2 shown as unchecked; 5.3 locked at 10% Daze Revenue Share

