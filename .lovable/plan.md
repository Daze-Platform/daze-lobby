

## Fix: POS Copy Instructions Crash for Most Providers

### Problem Found

In `PosStep.tsx`, the `handleCopyInstructions` function (line 252) reads directly from `PROVIDER_INSTRUCTIONS[selectedProvider]` -- but only 3 of the 13 providers have entries in that map (toast, micros_simphony, ncr_aloha). For the other 10 providers (par_brink, dinerware, positouch, squirrel_systems, xpient, maitred, ncr_cloud_connect, simphony_fe, simphonycloud, other), `instructions` is `undefined`, and `instructions.copyText` throws a runtime error, crashing the app.

The render code (line 322-327) correctly falls back to `DEFAULT_INSTRUCTIONS`, but the copy handler does not.

### Fix

**File: `src/components/portal/steps/PosStep.tsx`** (line 252)

Replace the direct lookup with the same fallback logic used in the render:

```typescript
// Before (crashes for 10 of 13 providers):
const instructions = PROVIDER_INSTRUCTIONS[selectedProvider];

// After (uses fallback):
const providerInstr = PROVIDER_INSTRUCTIONS[selectedProvider];
const fallback = {
  ...DEFAULT_INSTRUCTIONS,
  headline: `Next Steps for ${PROVIDERS.find(p => p.id === selectedProvider)?.name || "Integration"}`,
};
const instr = providerInstr || fallback;
await navigator.clipboard.writeText(instr.copyText);
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/portal/steps/PosStep.tsx` | Fix `handleCopyInstructions` to use fallback instructions for providers without custom copy text |

This is a one-line category fix -- no other changes needed. Everything else in the checklist flow (uploads, persistence, RLS) is solid after the recent fixes.
