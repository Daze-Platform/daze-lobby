

## Refine Daze Lobby Auth Card (LoginForm + SignUpForm)

### Issues Identified from Screenshot

1. **"Welcome back" heading** -- barely visible against white background (using `text-slate-900` but the Input's `bg-secondary/50` background creates a washed-out look)
2. **"Email" and "Password" labels** -- too faint, lost against the card
3. **Input fields** -- the `bg-secondary/50` fill makes them look like disabled grey blobs; text inside is hard to read
4. **"Or continue with" divider** -- muted text blends into background
5. **Google button** -- outline style lacks visual weight
6. **Overall** -- the card needs crisper contrast between elements and a more refined input treatment

### Design Direction

Move from "soft grey blobs" to a clean, high-contrast style with clear visual hierarchy:

- **Inputs**: White background with a subtle visible border instead of grey fill -- makes typed text crisp and labels clearly separate from fields
- **Labels**: Bump to `text-foreground` (slate-900) instead of relying on default muted tones
- **Headings**: Ensure "Welcome back" uses full `text-foreground` opacity
- **Divider**: Use the existing `OrDivider` component (already used in ClientLoginForm) for consistency
- **Google button**: Slightly darker border and bolder appearance
- **Spacing**: Tighten vertical rhythm for a more compact, premium feel

### Files Modified

**1. `src/components/auth/LoginForm.tsx`**
- Input fields: Add `bg-white border border-border` classes to override the default `bg-secondary/50` from the Input component
- Labels: Add `text-foreground` to ensure full contrast
- "Welcome back" heading: Verify `text-foreground` is applied (currently uses `text-slate-900` which should be fine -- the issue is the input backgrounds making everything feel washed out)
- Replace the manual divider markup with the `OrDivider` component for consistency
- Google button: Add `border-border/80` for slightly more visible border and `min-h-[44px]` for consistent button height

**2. `src/components/auth/SignUpForm.tsx`**
- Apply the same input, label, and divider refinements for consistency with LoginForm
- Same responsive sizing adjustments (`sm:rounded-[2rem]`, `sm:p-6 md:p-8`)

### No functional changes -- purely visual refinement.
