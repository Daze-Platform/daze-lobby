
# Add Client-Side Password Strength Validation

Since the Leaked Password Protection toggle is not available in the Lovable Cloud UI, we'll implement a robust client-side password strength checker as a compensating security control. This will help prevent users from choosing weak or commonly-breached passwords.

## What We'll Build

A real-time password strength indicator that:
- Checks against a list of the 1,000 most commonly breached passwords
- Enforces minimum security requirements (length, complexity)
- Provides visual feedback with a strength meter
- Blocks form submission for weak passwords

## Files to Create

### 1. Password Validation Utility (`src/lib/passwordValidation.ts`)
A utility module containing:
- A curated list of ~100 most common breached passwords (e.g., "password", "123456", "qwerty")
- A function to check password strength based on:
  - Minimum 8 characters (upgrading from current 6)
  - Contains uppercase letter
  - Contains lowercase letter
  - Contains number
  - Contains special character
  - Not in common passwords list
- Returns a strength score (0-5) and descriptive feedback

### 2. Password Strength Indicator Component (`src/components/auth/PasswordStrengthIndicator.tsx`)
A visual component showing:
- Progress bar that fills based on strength score
- Color-coded feedback (red/orange/yellow/green)
- Checklist of requirements with check/x icons
- Real-time updates as user types

## Files to Modify

### 1. SignUpForm.tsx
- Import and use the password validation utility
- Add the PasswordStrengthIndicator below the password input
- Block form submission if password strength is insufficient (score < 3)
- Show appropriate error message for weak passwords

### 2. ResetPasswordForm.tsx
- Apply the same validation logic
- Add the PasswordStrengthIndicator component
- Ensure users can't set a weak password during reset

## User Experience

When creating an account or resetting a password:
1. User starts typing password
2. Strength meter appears and updates in real-time
3. Checklist shows which requirements are met/unmet
4. If password is too weak, the submit button remains disabled
5. Clear messaging guides user to create a stronger password

## Visual Design

The strength indicator will match the existing auth form styling:
- Rounded corners (`rounded-xl`) consistent with inputs
- Brand colors for progress states
- Smooth transitions for visual feedback
- Compact layout that doesn't overwhelm the form

---

## Technical Details

### Common Passwords List (sample)
```text
password, 123456, 12345678, qwerty, abc123, monkey, 1234567,
letmein, trustno1, dragon, baseball, iloveyou, master, sunshine,
ashley, bailey, shadow, 123123, 654321, superman, qazwsx...
```
*(Full list will include ~100 most common breached passwords)*

### Strength Scoring Logic
```text
Score 0: Fails basic length requirement
Score 1: Meets length but missing multiple requirements
Score 2: Has 2-3 requirements met
Score 3: Has 4 requirements met (minimum acceptable)
Score 4: Has all 5 requirements met
Score 5: All requirements + not in common passwords list
```

### Color Mapping
- Score 0-1: Red (Weak)
- Score 2: Orange (Fair)
- Score 3: Yellow (Good)
- Score 4-5: Green (Strong)
