

## Add Toast POS Credential Input Fields

### What Changes

**File: `src/components/portal/steps/PosStep.tsx`**

Add three input fields (Client ID, Client Secret, Location GUID) that appear **only when Toast is the selected provider**, placed between the instructions card and the email template section.

### Details

1. **New state variables** for the three credential fields:
   - `clientIdValue` -- initialized from `data?.toast_client_id`
   - `clientSecretValue` -- initialized from `data?.toast_client_secret`
   - `locationGuidValue` -- initialized from `data?.toast_location_guid`

2. **New UI section** (inserted after the dark instructions card, around line 572, before the email template):
   - Only renders when `selectedProvider === "toast"`
   - Contains a small card/section with three labeled inputs:
     - **Client ID** -- text input, placeholder "e.g., abc123..."
     - **Client Secret** -- text input (or password-style), placeholder "e.g., xyz789..."
     - **Location GUID** -- text input, placeholder "e.g., 12345678-abcd-..."
   - Each field auto-saves via the existing debounce pattern (800ms), persisting to the task data JSONB alongside the existing `provider`, `status`, and `pms_name` fields

3. **Update `onUpdate` calls** to include the three new fields in the data payload when Toast is selected:
   - `handleSentToIT` and `handleProviderSelect` will pass `toast_client_id`, `toast_client_secret`, `toast_location_guid` alongside existing fields
   - The `handleBack` function will clear these fields when switching away from Toast

4. **Validation gate**: The "Mark as Sent to IT" button will additionally require all three Toast fields to be filled (non-empty) when Toast is the selected provider, in addition to the existing PMS name requirement.

### Visual Layout

```text
+------------------------------------------+
| [Instructions dark card]                 |
+------------------------------------------+

  Toast API Credentials
  +--------------------------------------+
  | Client ID          [_______________] |
  | Client Secret      [_______________] |
  | Location GUID      [_______________] |
  +--------------------------------------+

  Email Template: Request for Order Injection
  +--------------------------------------+
  | Subject: Action Required...          |
  | ...                                  |
  +--------------------------------------+
```

### Technical Notes

- The three new values are stored in the same `onboarding_tasks.data` JSONB column as `toast_client_id`, `toast_client_secret`, `toast_location_guid`
- Auto-save uses the same 800ms debounce ref already in place for PMS name
- Fields only appear for Toast -- other providers continue with the current flow unchanged
- The `onUpdate` prop signature does not need to change; the extra keys are passed as part of the existing data object spread

