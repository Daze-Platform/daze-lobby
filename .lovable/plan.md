

# Fix Checkbox Markers in Pilot Agreement PDF

## Problem

The PDF checkbox renderer uses a Unicode checkmark character (`✓`) via `pdf.text()`. jsPDF's built-in Helvetica font does not support this glyph, so it renders as an empty or garbled marker in the generated PDF. The screenshot confirms this -- checked items like "Client Revenue Share Fee" appear unchecked.

## Solution

Replace the `pdf.text("✓", ...)` call with manually drawn X lines using `pdf.line()`. This is font-independent and renders crisply at any zoom level.

## Changes

### File: `src/lib/pdf/renderers.ts` (lines 114-120)

Replace the checkmark text rendering with two diagonal lines drawn inside the checkbox box:

```
Before:
  if (checked) {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.text("✓", boxX + 0.3, ctx.y - 0.2);
  }

After:
  if (checked) {
    const inset = 0.7;
    pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.setLineWidth(0.5);
    pdf.line(boxX + inset, boxY + inset, boxX + boxSize - inset, boxY + boxSize - inset);
    pdf.line(boxX + boxSize - inset, boxY + inset, boxX + inset, boxY + boxSize - inset);
  }
```

This draws a bold X in the brand primary color inside the checkbox bounds, which is universally readable and font-independent.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/pdf/renderers.ts` | Replace Unicode checkmark text with drawn X lines in `renderCheckbox` |

