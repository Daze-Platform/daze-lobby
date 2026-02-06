
# Fix: Missing "Confirm & Sign" Button in Pilot Agreement Modal

## Problem Analysis

The "Clear" and "Confirm & Sign" buttons exist in the code (`ReviewSignModal.tsx` lines 202-229), but they are not visible in the UI. Based on the screenshot, the modal content is being cut off before the buttons section.

**Root Cause:**
The signature panel layout uses `flex flex-col justify-between` which should work, but the content inside is overflowing the container. The issue is that:
1. The modal has a fixed height of `h-[85vh]`
2. The content wrapper uses `flex-1` but doesn't properly constrain its children
3. The signing state wrapper doesn't have `flex-1` to take remaining space, so `justify-between` doesn't work as intended

## Solution

Restructure the signing state layout to ensure the buttons are always visible at the bottom of the panel.

### Technical Changes

**File: `src/components/portal/ReviewSignModal.tsx`**

1. **Fix the signing state layout structure:**
   - Wrap the signing state content in a flex container with proper height distribution
   - Make the signature content area take up available space with `flex-1`
   - Ensure the buttons section stays at the bottom with proper spacing

2. **Specific changes to lines 188-235:**

```tsx
{/* ========== SIGNING STATE ========== */}
<>
  <div className="flex-1 flex flex-col">
    <p className="text-sm text-muted-foreground mb-4">
      By signing below, you agree to the terms and conditions outlined in the Pilot Agreement.
    </p>
    <SignaturePad 
      ref={signaturePadRef}
      onSignatureChange={handleSignatureChange} 
    />
  </div>

  <div className="pt-4 space-y-3 border-t mt-4">
    <div className="flex gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleClear}
        disabled={!hasSignature || isSubmitting}
        className="flex-1"
      >
        Clear
      </Button>
      <Button
        onClick={handleConfirmSign}
        disabled={!hasSignature || isSubmitting}
        className="flex-[2] gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing...
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            Confirm & Sign
          </>
        )}
      </Button>
    </div>
    <p className="text-xs text-center text-muted-foreground">
      Your signature will be securely stored and timestamped
    </p>
  </div>
</>
```

### Why This Fixes the Issue

1. **`flex-1` on content wrapper**: Ensures the signature pad area expands but doesn't push buttons off-screen
2. **Removed `space-y-4` wrapper**: Simplified the nesting to prevent layout conflicts
3. **Added `border-t mt-4`**: Adds visual separation for the action area
4. **Changed `pt-6` to `pt-4`**: Slightly reduces padding to ensure buttons fit

### Layout Structure After Fix

```text
+----------------------------------+
| Your Signature (header)          |
+----------------------------------+
|                                  |
| Instructions text                | <- flex-1 (grows)
| +----------------------------+   |
| |    Signature Canvas        |   |
| |       [Sign here]          |   |
| +----------------------------+   |
|                                  |
+----------------------------------+
| [  Clear  ] [ Confirm & Sign  ]  | <- Stays at bottom
| Securely stored message          |
+----------------------------------+
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/portal/ReviewSignModal.tsx` | Restructure signing state flex layout (lines ~188-235) |

## Verification Steps

After implementation:
1. Open the Pilot Agreement modal from the Legal step
2. Verify both "Clear" and "Confirm & Sign" buttons are visible
3. Confirm buttons are disabled initially (before drawing)
4. Draw on canvas and verify buttons become enabled
5. Click "Clear" to verify it clears the signature
6. Draw again and click "Confirm & Sign" to verify signing flow works
