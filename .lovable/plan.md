

## POS Instructions Panel Improvements

### Changes (single file: `src/components/portal/steps/PosStep.tsx`)

**1. Taller code block container**
- Change `max-h-[160px]` on the `<pre>` element (line ~299) to `max-h-[320px]` so the instructions text is visible without scrolling in most cases.

**2. Add copy icon button on top-right of code block**
- Wrap the `<pre>` in a `relative` container div.
- Add a small icon button (using the existing `Copy`/`Check` icons from lucide-react) positioned `absolute top-2 right-2` that copies `instructions.copyText` to the clipboard.
- Reuse the same clipboard logic already in `handleCopyInstructions`, showing a brief checkmark state after copying.
- This provides a quick-access copy without needing to scroll down to the main "Copy Instructions for IT" button.

### Technical Detail

```text
Before:
  <div className="relative">
    <pre className="... max-h-[160px] ...">

After:
  <div className="relative group">
    <button onClick={handleCopyInstructions} className="absolute top-2 right-2 ...">
      <Copy /> or <Check />
    </button>
    <pre className="... max-h-[320px] ...">
```

Both changes are in the instructions panel motion block, lines ~295-302 of PosStep.tsx.
