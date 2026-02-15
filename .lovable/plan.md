

## Fix: Invisible Text on Auth Form Inputs

### Problem
The auth form inputs (Full Name, Email, Password) show grey backgrounds with barely visible text. The Tailwind `!important` modifiers (`!bg-white`, `!text-foreground`) are not reliably overriding the base Input component's `bg-secondary/50` styling.

### Root Cause
The base `Input` component (`src/components/ui/input.tsx`) applies `bg-secondary/50` and uses CSS custom properties for text color. The `!` prefix in Tailwind classes is meant to add `!important`, but CSS variable resolution and specificity conflicts cause them to fail intermittently.

### Solution
Replace the unreliable `!important` Tailwind classes with inline `style` attributes on all auth form inputs. Inline styles always win in CSS specificity.

### Changes

**File: `src/components/auth/SignUpForm.tsx`** -- 3 inputs (Full Name, Email, Password)

Replace `className` overrides like:
```
className="rounded-xl !bg-white !border !border-border !text-foreground placeholder:!text-muted-foreground"
```
With:
```
className="rounded-xl"
style={{ backgroundColor: '#ffffff', color: '#1e293b', borderColor: '#e2e8f0', border: '1px solid #e2e8f0' }}
```

**File: `src/components/auth/LoginForm.tsx`** -- 2 inputs (Email, Password)

Same change -- replace `!important` classes with inline `style` for background, text color, and border.

**File: `src/components/auth/ForgotPasswordForm.tsx`** -- Check and fix if it has the same pattern.

**File: `src/components/auth/ResetPasswordForm.tsx`** -- Already provided; check and fix the 2 inputs (New Password, Confirm Password).

### Result
- All auth inputs will have a crisp white background with dark text, guaranteed by inline styles
- No more invisible or hard-to-read input text
- Consistent appearance across all auth views (login, signup, forgot password, reset password)
