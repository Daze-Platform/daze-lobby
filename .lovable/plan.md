

## Allow Users to Choose Between Daze and Client Revenue Share

### Problem
The pricing section (Section D) in the Pilot Agreement form is hardcoded to "Daze Revenue Share" at 10%. Users cannot select "Client Revenue Share" as an alternative, even though the PDF document renders both options (sections 5.3 and 5.4) with checkbox indicators.

### Solution
Replace the static pricing display with interactive radio buttons letting users choose between "Daze Revenue Share" and "Client Revenue Share," plus an editable percentage input.

### Technical Changes

**File: `src/components/portal/ReviewSignModal.tsx`**

1. **Convert hardcoded constants to state** (lines 450-452):
   - Change `const pricingModel = "daze_rev_share" as const;` to `const [pricingModel, setPricingModel] = useState<"daze_rev_share" | "client_rev_share">("daze_rev_share");`
   - Change `const pricingAmount = "10";` to `const [pricingAmount, setPricingAmount] = useState("10");`

2. **Replace the static display with a form** (lines 726-733):
   - Add two radio options using the existing `RadioGroup` component:
     - **Daze Revenue Share** — "Daze retains a % of gross transaction value"
     - **Client Revenue Share** — "Client pays Daze a % of gross food & beverage sales"
   - Add a percentage input field (number, min 1, max 100) below the radio selection
   - Style consistently with the rest of the form sections

3. **Update `useMemo` dependency array** (line 526):
   - Since `pricingModel` and `pricingAmount` are now state, they're already reactive — just ensure they stay in the dependency array

### UI Layout (Section D)

```
D -- Pricing
  ( ) Daze Revenue Share
      Daze retains a % of gross transaction value
  ( ) Client Revenue Share
      Client pays Daze a % of gross food & beverage sales

  Revenue Share %: [10]
```

### What Changes in the PDF
The correct checkbox (`[X]`) will appear next to whichever option the user selected (5.3 or 5.4), and the entered percentage fills the blank. This already works via the existing `pSub`/`pDaze`/`pClient` logic in the agreement text builder.

| File | Change |
|------|--------|
| `src/components/portal/ReviewSignModal.tsx` | Convert pricing to state; replace static display with radio group + % input |

