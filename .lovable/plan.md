

# Side-by-Side Form and Agreement Layout

## Current Layout

The ReviewSignModal currently stacks the form fields AND the agreement text in the **left panel**, while the **right panel** is reserved solely for the signature pad. This forces users to scroll past all form sections before they can see the agreement document, making it hard to verify their inputs in context.

## Proposed Layout

Restructure the two-column grid so that:

- **Left Panel**: Form input sections (A through E) -- scrollable independently
- **Right Panel**: Live agreement document (with highlighted values) -- scrollable independently
- **Signature Section**: Moves below the agreement in the right panel, or into a sticky footer area

On mobile (single column), the layout falls back to the current stacked behavior.

## Technical Changes

### File: `src/components/portal/ReviewSignModal.tsx`

1. **Left panel (form only)**: Keep the form sections (A-E) in the left column with their own `ScrollArea`. Remove the agreement text from this panel.

2. **Right panel (agreement + signature)**: Move the agreement document into the right panel. When unsigned, show the live agreement text at the top (scrollable) with the signature pad and action buttons pinned at the bottom. When signed, show the signed agreement view and signature confirmation as it does today.

3. **Sticky signature footer**: Inside the right panel, use a flex layout where the agreement text is `flex-1 overflow-auto` and the signature section is `shrink-0` pinned at the bottom, so users always have access to sign without scrolling.

4. **Mobile fallback**: On small screens (`grid-cols-1`), keep the stacked order: form first, then agreement, then signature -- matching current behavior.

### Structural sketch (desktop, unsigned state)

```text
+-------------------------------+-------------------------------+
|  LEFT PANEL (scrollable)      |  RIGHT PANEL                  |
|                               |                               |
|  Section A: Client Identity   |  Agreement Document           |
|  Section B: Pilot Scope       |  (live-updating, scrollable)  |
|  Section C: Pilot Term        |                               |
|  Section D: Pricing           |                               |
|  Section E: POS Integration   |                               |
|                               |-------------------------------|
|                               |  Signature Pad + Sign Button  |
|                               |  (pinned at bottom)           |
+-------------------------------+-------------------------------+
```

### Key details

- The agreement text already uses `HighlightedText` to highlight user-entered values in real-time -- this stays as-is and becomes immediately visible alongside the form
- The `useDeferredValue` optimization for the agreement text remains to keep typing responsive
- The Download PDF button stays with the agreement header in the right panel
- The "Complete all required fields" warning moves to the right panel above the signature pad
- No changes to form logic, validation, or data flow -- purely a layout restructure
- The `max-h-[200px]` constraint on the agreement text (currently used on mobile) will be removed for the right panel view since it gets its own scrollable area; a similar constraint stays for mobile stacked view

