
# Refine Auth Page: Sun Exposure, Centering, and No Scroll

## Changes

### 1. Regenerate auth-artwork.png with better sun exposure
The current artwork image shows the sun barely peeking in at the bottom-right corner. The image will be regenerated using AI to reposition the sun so it's more prominently visible -- higher up and with better exposure/glow, while keeping the same blue sky, clouds, and text style.

### 2. Center the auth card properly
Currently the left-side form panel uses `min-h-screen` which can push content off-center. Both `Auth.tsx` and `PortalLogin.tsx` will be updated to use `h-screen` on the root container and remove `min-h-screen` from the form panel, ensuring the card is vertically centered within the viewport.

### 3. Disable scrolling on auth pages
The root container on both auth pages will be set to `h-screen overflow-hidden` to lock the viewport and prevent any scrolling.

## Files Modified

- **`src/assets/auth-artwork.png`** -- Regenerated with the sun more prominently exposed (higher position, better glow/warmth)
- **`src/pages/Auth.tsx`** -- Root container changed from `min-h-screen` to `h-screen overflow-hidden`; form panel changed from `min-h-screen` to `h-full` for proper centering
- **`src/pages/PortalLogin.tsx`** -- Same layout fixes as Auth.tsx

## Technical Details

### Layout changes (Auth.tsx and PortalLogin.tsx)
- Root `div`: `min-h-screen` becomes `h-screen overflow-hidden`
- Left form panel: remove `min-h-screen lg:min-h-0`, use `h-full` instead
- Right art panel: remove `min-h-screen` where present, use `h-full`
- These changes lock the page to the viewport height and prevent scrolling while keeping the form card vertically centered via the existing `flex items-center justify-center`

### Image regeneration
- The existing `auth-artwork.png` will be edited via AI image generation to move the sun higher and make it more prominent with better exposure/warmth, while preserving the clouds, sky, and text overlay
