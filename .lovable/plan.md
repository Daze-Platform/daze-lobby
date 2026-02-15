

## Fix: Illegible Text Across All Auth Components

### Problem
Text using Tailwind CSS variable classes (`text-slate-900`, `text-foreground`, `text-muted-foreground`) renders as nearly invisible on white auth cards. The screenshot shows the "Check your email" success screen where the heading is barely readable.

### Root Cause
Same as the input fix -- CSS custom properties resolve to very light values that lack contrast against white backgrounds. Tailwind utility classes are unreliable here, so inline `style` attributes are needed.

### Solution
Replace all Tailwind text-color classes with inline `style` attributes across every auth component, using:
- Headings/labels: `color: '#1e293b'` (slate-900)
- Descriptions/muted text: `color: '#64748b'` (slate-500)

### Files and Changes

**1. `src/components/auth/SignUpForm.tsx`** -- Success screen (lines 86-88)
- `h1` "Check your email": replace `className="... text-slate-900"` with `style={{ color: '#1e293b' }}`
- `p` description: replace `className="text-muted-foreground ..."` with `style={{ color: '#64748b' }}`

**2. `src/components/auth/ForgotPasswordForm.tsx`** -- Header (lines 50-54)
- `span` "Daze Lobby": already has inline style -- confirmed OK
- `h1` "Reset your password": replace `text-slate-900` with `style={{ color: '#1e293b' }}`
- `p` description: replace `text-muted-foreground` with `style={{ color: '#64748b' }}`
- Label "Email" (line 87): add `style={{ color: '#1e293b' }}`
- Success alert text: add inline color to ensure readability

**3. `src/components/auth/ResetPasswordForm.tsx`** -- Header (lines 72-78)
- `span` "Daze Lobby": replace `text-slate-900` with `style={{ color: '#1e293b' }}`
- `h1` "Set new password": replace `text-slate-900` with `style={{ color: '#1e293b' }}`
- `p` description: replace `text-muted-foreground` with `style={{ color: '#64748b' }}`
- Labels: add `style={{ color: '#1e293b' }}`
- Eye toggle buttons: add `style={{ color: '#94a3b8' }}` for visibility

**4. `src/components/auth/MFAChallengeForm.tsx`** -- Header (lines 67-78)
- `span` "Daze Lobby": replace `text-slate-900` with `style={{ color: '#1e293b' }}`
- `h1` "Two-Factor Authentication": replace `text-slate-900` with `style={{ color: '#1e293b' }}`
- `p` description: replace `text-muted-foreground` with `style={{ color: '#64748b' }}`
- Label "Verification Code" (line 91): add `style={{ color: '#1e293b' }}`
- Cancel link (line 123): replace `text-muted-foreground` with `style={{ color: '#64748b' }}`

**5. `src/components/auth/LoginForm.tsx`** -- Labels and footer text
- Label "Email" (line 260): add `style={{ color: '#1e293b' }}`
- Label "Password" (line 276): add `style={{ color: '#1e293b' }}`
- Footer "Don't have an account?" (line 358): replace `text-muted-foreground` with `style={{ color: '#64748b' }}`
- Eye toggle button: add `style={{ color: '#94a3b8' }}`

**6. `src/components/auth/SignUpForm.tsx`** -- Labels and footer text (main form)
- Labels for Full Name, Email, Password: add `style={{ color: '#1e293b' }}`
- Footer "Already have an account?" (line 220): replace `text-muted-foreground` with `style={{ color: '#64748b' }}`
- Eye toggle button: add `style={{ color: '#94a3b8' }}`

**7. `src/components/auth/ClientLoginForm.tsx`** -- All text elements
- `span` "Partner Portal" (line 230): replace `text-foreground` with `style={{ color: '#1e293b' }}`
- `h1` heading (line 234): replace `text-foreground` with `style={{ color: '#1e293b' }}`
- `p` description (line 237): replace `text-muted-foreground` with `style={{ color: '#64748b' }}`
- Success screen `h1` "Check your email" (line 209): replace `text-foreground` with `style={{ color: '#1e293b' }}`
- Success screen `p` (line 210): replace `text-muted-foreground` with `style={{ color: '#64748b' }}`
- All Labels: add `style={{ color: '#1e293b' }}`
- Footer text: replace `text-muted-foreground` with `style={{ color: '#64748b' }}`
- Forgot password link: add `style={{ color: '#64748b' }}`
- Eye toggle: add `style={{ color: '#94a3b8' }}`

### Result
All text on every auth screen (login, signup, forgot password, reset password, MFA, client portal login) will be crisp and legible with guaranteed contrast, using inline styles that cannot be overridden by CSS variable issues.

