

## Add Order Injection Email Template to Toast POS Instructions

### What Changes

**File: `src/components/portal/steps/PosStep.tsx`**

1. **Add an `emailTemplate` field** to the Toast provider instructions object containing the Order Injection email text (subject + body). This keeps it alongside the existing `headline`, `steps`, and `copyText`.

2. **Add `emailCopied` state** (separate from the existing `copied` state) to track the copy status of the email template independently.

3. **Add a new UI section** in the instructions panel (between the code block and the PMS name field, around line 516). This section renders only when `selectedProvider === "toast"` and displays:
   - A labeled header: "Email Template: Request for Order Injection"
   - A styled card showing the email content (subject line + body)
   - A copy button (top-right corner, matching the existing code block copy pattern) that copies the email text to clipboard
   - A toast notification on copy: "Email template copied!"

4. **The email text** will use the client name from context where available, falling back to `[Property Name]`. Since the component has access to `useClient()`, we can pull the client name to personalize the template for Springhill Suites Orange Beach or any future client.

### Email Content (Copyable)
```
Subject: Action Required: Enable Order Injection for [Client Name]

Hi [Rep Name],

We are launching a mobile ordering pilot at [Client Name] using a custom integration built on the Daze Platform.

We have already generated our API credentials, but we need you to manually enable "Order Injection" (Write Access) for our API Client ID: [Insert Your Client ID].

This is a property-specific requirement to allow guests to fire orders directly to our KDS and process room charges. Please confirm once this is toggled on so we can begin live testing.

Best regards,

[Management Name]
[Client Name]
```

### Technical Details

- The email template section is only rendered when `selectedProvider === "toast"` so it does not appear for other POS providers
- Uses the same copy icon pattern (Copy/Check toggle) already used for the instructions code block
- `emailCopied` state resets after 2 seconds, matching existing behavior
- Client name is pulled from `useClient()` context to dynamically populate the template (e.g., "Springhill Suites Orange Beach")
- Activity logging fires `pos_email_template_copied` on copy

