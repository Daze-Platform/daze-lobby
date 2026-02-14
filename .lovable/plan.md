

## Fix: Don't Pre-Populate Toast Credential Fields

### Problem
The Client ID, Client Secret, and Location GUID fields are currently initialized from saved database values. These fields should always start empty so the client enters their own credentials after following the instructions. Saved values should still persist to the database on input, but the fields should not pre-populate from existing data.

### Changes

**File: `src/components/portal/steps/PosStep.tsx`**

1. **Remove pre-population from state initialization** (lines 213-215): Change the three credential `useState` calls to always initialize as empty strings instead of reading from `savedClientId` / `savedClientSecret` / `savedLocationGuid`.

   Before:
   ```typescript
   const [toastClientId, setToastClientId] = useState(savedClientId || "");
   const [toastClientSecret, setToastClientSecret] = useState(savedClientSecret || "");
   const [toastLocationGuid, setToastLocationGuid] = useState(savedLocationGuid || "");
   ```

   After:
   ```typescript
   const [toastClientId, setToastClientId] = useState("");
   const [toastClientSecret, setToastClientSecret] = useState("");
   const [toastLocationGuid, setToastLocationGuid] = useState("");
   ```

2. **Clean up unused variables** (lines 207-209): Remove `savedClientId`, `savedClientSecret`, and `savedLocationGuid` since they are no longer referenced.

### Result
- The three credential fields will always appear empty when the page loads
- Clients type in their credentials fresh after following the setup instructions
- Values still auto-save to the database via the existing debounce mechanism
- No other behavior changes

