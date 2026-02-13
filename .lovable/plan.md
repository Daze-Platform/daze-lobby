
## Fix Daze Lobby Auth Card Legibility and Logo Placement

### Issues Identified (from screenshot)

1. **"Daze Lobby" title** is barely readable -- uses `text-slate-900` but appears washed out against the white card
2. **"Welcome back" heading** is nearly invisible -- same contrast issue
3. **Logo placement** -- currently inline (side-by-side) with "Daze Lobby" text; user wants it stacked vertically (logo on top, text below)
4. **Input text** is hard to read when filled in (placeholder and typed text both appear faint)

### Changes

**1. `src/components/auth/LoginForm.tsx`**

- **Logo layout**: Change from `flex-row` to `flex-col` so the Daze Cloud logo sits above the "Daze Lobby" text
- **Logo asset**: Switch from `daze-logo.png` to `daze-cloud-logo.png` (the preferred branded logo used on the Partner Portal)
- **Logo size**: Bump to `h-12 w-12 sm:h-14 sm:w-14` for better visual presence
- **Text contrast**: Change "Daze Lobby" and "Welcome back" from `text-slate-900` to explicit dark color using style prop (`color: '#1e293b'`) to guarantee visibility regardless of theme variable resolution
- **Input text**: Add `!text-foreground placeholder:!text-muted-foreground` to ensure typed text and placeholders are legible

**2. `src/components/auth/SignUpForm.tsx`**

- Apply the exact same logo, layout, and contrast fixes for consistency

### No functional changes -- purely visual refinement.
