

# Improve Checkmark-to-SIGNED Spacing

## Change

Increase the gap between the drawn checkmark and the "SIGNED" text by adjusting the offset from `3` to `5` mm on line 82.

## Technical Detail

### File: `src/lib/generateAgreementPdf.ts` (line 82)

```
Before:
const checkX = signedTextX - pdf.getTextWidth("SIGNED") - 3;

After:
const checkX = signedTextX - pdf.getTextWidth("SIGNED") - 5;
```

This moves the checkmark 2mm further left, giving cleaner visual separation from the text.

