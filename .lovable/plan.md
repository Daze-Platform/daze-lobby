

## Fix: Browser Autofill Pre-Populating Toast Credential Fields

### Root Cause

The code is correct -- fields initialize as empty strings. The issue is **browser autofill**. The browser's password manager recognizes the field names ("client-id", "client-secret") and the `type="password"` attribute, then automatically fills them with saved credentials.

### Solution

Add `autoComplete="off"` to all three Toast credential inputs to prevent browser autofill from populating them.

### Changes

**File: `src/components/portal/steps/PosStep.tsx`**

1. **Client ID input** (~line 605): Add `autoComplete="off"` attribute
2. **Client Secret input** (~line 618): Add `autoComplete="new-password"` attribute (stronger than "off" for password-type fields, as browsers may ignore "off" on password inputs)
3. **Location GUID input** (~line 632): Add `autoComplete="off"` attribute

Additionally, wrap the three inputs in a `<form>` tag (or add `autoComplete="off"` to the parent `<div>`) to reinforce the browser hint.

### Technical Detail

- `autoComplete="new-password"` is specifically designed to tell browsers "this is a new credential, do not autofill" -- it works more reliably than `autoComplete="off"` on password-type fields
- `autoComplete="off"` works for standard text inputs
- No functional or data persistence changes -- just autofill prevention

