

## Highlight Credential Terms in Orange in POS Instructions

### What Changes

**File: `src/components/portal/steps/PosStep.tsx`**

Update the `renderRichLine` regex and rendering logic to recognize and highlight the specific credential terms -- "Client ID", "Client Secret", and "Location GUID" -- in a readable orange color within the dark instruction card.

### Approach

1. **Expand the regex** (~line 538): Add a new pattern to match the exact phrases `Client ID`, `Client Secret`, and `Location GUID` as additional capture groups.

   Updated regex adds: `|Client ID|Client Secret|Location GUID`

2. **Add a rendering branch** (~line 546-555): When a matched token is one of these three credential terms, render it with `text-orange-400 font-semibold` styling so it stands out clearly against the dark background and matches the existing orange accent color used for step numbers and bullets.

### Result

Step 3's text will render as:
- "Copy and paste the **Client ID**, **Client Secret**, and **Location GUID** (found under...)" with those three terms in orange, making it immediately clear which fields the client needs to locate and enter.

### Technical Detail

- No data or persistence changes -- purely a visual formatting update
- The orange color (`text-orange-400`) is consistent with the existing step-number and bullet styling in the instruction card
- Only exact-match phrases are highlighted, so no risk of false positives elsewhere in the text

