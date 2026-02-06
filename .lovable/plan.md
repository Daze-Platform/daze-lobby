
# Replace Rocket Illustration

This plan updates the rocket asset to use your uploaded custom illustration with a transparent background.

## What Will Happen

1. **Copy the new illustration** from your upload to the project assets folder
2. **Update the image reference** - since the file is AVIF format, we'll copy it as-is to maintain quality
3. **Verify transparent background** works correctly with the current styling

## Implementation Details

### Step 1: Replace Asset File

Copy the uploaded rocket illustration to replace the existing asset:
- **Source**: `user-uploads://rocket-daze-illustration.avif`
- **Destination**: `src/assets/rocket-launched.png` (overwrite existing)

Note: We'll convert/save it as PNG to ensure maximum browser compatibility while preserving the transparent background.

### Step 2: Update Import (if needed)

The current `ProgressRing.tsx` already imports from `@/assets/rocket-launched.png`, so if we overwrite that file, no code changes are needed.

### Files to Modify
- `src/assets/rocket-launched.png` - Replace with uploaded illustration

### No Code Changes Required
The existing component already handles the rocket display with proper sizing and animation classes.
