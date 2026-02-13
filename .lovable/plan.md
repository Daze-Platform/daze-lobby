
# Fix "SIGNED" Badge in PDF Header

## Problem

The PDF header uses `pdf.text("✓ SIGNED", ...)` which contains a Unicode checkmark (`✓`) unsupported by jsPDF's built-in Helvetica font. This causes garbled rendering like `' S I G N E D` with spaced-out characters.

## Solution

Replace the text-based checkmark with a drawn checkmark (two lines forming a "V" shape) followed by plain "SIGNED" text. This matches the same approach used for the checkbox fix.

## Changes

### File: `src/lib/generateAgreementPdf.ts` (lines 75-78)

Replace the single `pdf.text("✓ SIGNED", ...)` call with:

1. Draw a small checkmark using `pdf.line()` (two strokes forming a V/check shape) in green
2. Render plain `"SIGNED"` text offset slightly to the left to make room for the drawn mark

```
// Before:
pdf.text("✓ SIGNED", pageWidth - margin, ctx.y + 16, { align: "right" });

// After:
const signedTextX = pageWidth - margin;
const signedY = ctx.y + 16;
pdf.text("SIGNED", signedTextX, signedY, { align: "right" });
// Draw a small checkmark to the left of "SIGNED"
const checkX = signedTextX - pdf.getTextWidth("SIGNED") - 3;
pdf.setDrawColor(34, 197, 94);
pdf.setLineWidth(0.5);
pdf.line(checkX, signedY - 1, checkX + 1.2, signedY + 0.5);
pdf.line(checkX + 1.2, signedY + 0.5, checkX + 3.5, signedY - 2.5);
```

## Files Changed

| File | Change |
|------|--------|
| `src/lib/generateAgreementPdf.ts` | Replace Unicode checkmark with drawn check lines next to "SIGNED" text |
