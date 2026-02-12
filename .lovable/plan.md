

# Move Signature Section to Modal Footer

## Goal

Move the signature pad and action buttons from the right panel into a full-width footer at the bottom of the modal. This gives the agreement document in the right panel the full vertical space it needs.

## New Layout (Desktop, Unsigned)

```text
+-------------------------------+-------------------------------+
|  LEFT PANEL (scrollable)      |  RIGHT PANEL (scrollable)     |
|                               |                               |
|  Section A: Client Identity   |  Agreement Document           |
|  Section B: Pilot Scope       |  (live-updating, full height) |
|  Section C: Pilot Term        |                               |
|  Section D: Pricing           |                               |
|  Section E: POS Integration   |                               |
+---------------------------------------------------------------+
|  FOOTER (full width, pinned)                                  |
|  [Validation warning] [Signature Pad] [Clear] [Sign]          |
+---------------------------------------------------------------+
```

## Technical Changes

### File: `src/components/portal/ReviewSignModal.tsx`

1. **Extract signature section** from the right panel `<div>` (lines 847-945) and move it outside/below the two-column grid, making it a sibling of the grid rather than a child of the right column.

2. **Right panel simplification**: The right panel (lines 824-946) will only contain the agreement document section (header + scrollable text). Remove the `shrink-0 border-t` signature wrapper. The agreement `ScrollArea` becomes the full content of the right panel.

3. **Full-width footer**: Place the signature section as a new `shrink-0 border-t` div after the grid closes (after line 947's `</div>`). This footer spans the full modal width.

4. **Compact signature layout for desktop**: On larger screens, arrange the signature pad and buttons side-by-side (horizontal) using `lg:flex-row` to save vertical space. The "By signing..." text, signature pad, and buttons sit in a row. On mobile, keep the current stacked layout.

5. **Signed state footer**: When signed, show the compact confirmation (checkmark, "Agreement Signed", signature thumbnail, date) in the footer, also laid out horizontally on desktop.

6. **No changes** to form logic, validation, agreement text rendering, mobile stacked agreement section, or draft-save behavior.
