

## Replace Generic POS Code Block with Copyable Email Template

### Problem
The code block area (lines 501-517 in PosStep.tsx) currently shows the old generic "POS INTEGRATION REQUEST" text for all providers. The user wants this replaced with the new Order Injection email template that includes a proper copy button -- the same pattern already implemented for Toast below it.

### Changes

**File: `src/components/portal/steps/PosStep.tsx`**

1. **Update `DEFAULT_INSTRUCTIONS.copyText`** (line 86-100) -- Replace the generic "POS INTEGRATION REQUEST" text with the Order Injection email template, using `[Property Name]` as placeholder (will be dynamically replaced at render time).

2. **Replace the code block section** (lines 501-517) with the email template card pattern that already exists for Toast (lines 519-575). This means:
   - Remove the raw `<pre><code>` block
   - Replace it with a styled email template card showing Subject line, body paragraphs, and a copy button with hover-reveal behavior
   - Use the client name from `useClient()` context to dynamically populate the property name
   - Reuse the existing `copied` state and `handleCopyInstructions` function for the copy button

3. **Remove the duplicate Toast-only email section** (lines 519-575) since the email template will now render for all providers in the main section. The Toast provider will use its own `copyText` (Order Injection specific), while other providers use the default template.

4. **Update `DEFAULT_INSTRUCTIONS` content** to match the Order Injection email format:
   - Subject: `Action Required: Enable Order Injection for [Client Name]`
   - Body: mobile ordering pilot, API credentials, Order Injection Write Access request
   - Sign-off: `[Management Name]` + client name

### Result
- All providers show a styled email template card with a copy button instead of the raw code block
- Toast uses its own customized email text; other providers use the default
- The copy button copies the full email text to clipboard with a success toast
- Client name is dynamically inserted from context

### Technical Details
- `emailCopied` state is already available (added in previous update)
- `client` is already extracted from `useClient()` 
- The email card UI pattern is already proven from the Toast-only section -- just needs to be promoted to the shared rendering path
- The `handleCopyInstructions` function will be updated to copy the email template text with the dynamic client name substituted in

