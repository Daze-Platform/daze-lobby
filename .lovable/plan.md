

## Make POS Instructions More Colorful and Rich

### What Changes

**File: `src/components/portal/steps/PosStep.tsx`**

Transform the plain-text steps list (currently a light `bg-muted/50` card with `text-sm text-muted-foreground` paragraphs) into a richer, markdown-inspired dark card with colored elements, matching the screenshot reference.

### Visual Updates

**Steps container** (lines 494-500):
- Change from `bg-muted/50` to a dark card: `bg-zinc-900 dark:bg-zinc-950 text-zinc-100` with `rounded-xl` and `font-mono text-xs`
- Add a header bar at the top with a "Markdown" label and the existing copy button (moved here)

**Step content rendering**:
- Replace plain `<p>` tags with a rich rendering function that parses each step string to apply:
  - **Bold text**: Wrap text between `**` markers in `<strong className="text-white font-bold">`
  - **Orange bullet points**: Use `*` markers styled with `text-orange-400`
  - **Green highlights**: For URLs and email addresses, render in `text-emerald-400`
  - **Step numbers**: Render numbered headings (e.g., "1. Activate...") in `font-bold text-white text-sm` with extra top margin
  - **Sub-bullets**: Indented items with colored dash/bullet markers

**New helper function** `renderRichStep(step: string)`:
- Splits the step text and applies inline formatting
- Detects patterns like URLs (`pos.toasttab.com`), emails (`angelo@dazeapp.com`), and quoted terms to apply accent colors
- Numbers at the start of lines get bold white treatment
- Bullet items (`-`, `*`) get orange-colored markers

### Result
- Instructions look like the colorful markdown preview in the screenshot
- Dark background with syntax-highlighted text (white bold, orange bullets, green links)
- Copy button in the header bar for easy copying
- Professional, developer-friendly aesthetic matching the reference image

### Technical Details
- Only the rendering changes -- the underlying data structure (`steps[]`, `copyText`) stays the same
- The copy button functionality remains identical, just repositioned into the card header
- Dark styling uses Tailwind classes (`bg-zinc-900`, `text-zinc-100`, etc.) that work in both light and dark mode
- The rich text parsing is done at render time with a small inline function, no external markdown library needed
