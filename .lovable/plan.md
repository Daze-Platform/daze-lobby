

# Remove Tablets/Mounts Fields from Section 2.3

## Summary

Strip out the "Number of Tablets" and "Mounts/Stands" fields from the Pilot Agreement. Section 2.3 will remain as a simple binary choice: "No Daze Hardware Required" or "Daze-Provided Hardware."

## Changes

### 1. `src/types/pilotAgreement.ts`
- Remove `num_tablets` and `mounts_stands` properties from the `PilotAgreementData` interface

### 2. `src/lib/pdf/sections.ts`
- Remove the conditional bullet-list block (lines 116-118) that renders "Number of Tablets" and "Mounts/Stands" under the Daze-Provided checkbox
- Remove the `numTablets` and `mountsStands` variables (lines 21-22)

### 3. `src/components/portal/ReviewSignModal.tsx`
- Remove `numTablets` / `mountsStands` variable declarations (lines 99-100)
- Remove `numTablets` / `mountsStands` state hooks (lines 448-449)
- Remove hydration of those fields from saved data (lines 497-498)
- Remove them from the collected agreement data object (lines 525-526)
- Remove them from the `useMemo` dependency array (line 535)
- Remove the two form input fields (lines 709-716) for tablets and mounts
- Remove the bullet-list lines from the agreement text template (lines 160-161)

### 4. `src/hooks/useClientPortal.ts`
- Remove `num_tablets` and `mounts_stands` from the data mapping (lines 193-194)

## Files Changed

| File | Change |
|------|--------|
| `src/types/pilotAgreement.ts` | Remove `num_tablets` and `mounts_stands` from interface |
| `src/lib/pdf/sections.ts` | Remove bullet-list and associated variables |
| `src/components/portal/ReviewSignModal.tsx` | Remove state, inputs, text template lines, and dependencies |
| `src/hooks/useClientPortal.ts` | Remove field mapping |

