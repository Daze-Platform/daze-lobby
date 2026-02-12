

# Fix: Artwork Text Cut-Off on Portal Login Page

## Problem

The right-side artwork panel on the login page uses `object-cover`, which crops the image to fill the container. This causes the tagline text at the top of the artwork ("Effortless service, floating on air.") to be cut off since the image is taller than the viewport.

## Solution

Change the image positioning from `object-cover` to `object-contain` with a complementary background color so the artwork scales down to fit entirely within the panel without any cropping. The background color will match the sky tone in the artwork for a seamless look.

Alternatively, use `object-cover object-bottom` to anchor the crop at the bottom, pushing the visible area upward to reveal the text. However, `object-contain` is cleaner since it guarantees all artwork content is always visible regardless of viewport size.

## Changes

**`src/components/auth/SketchyArtPanel.tsx`**

Update the container to have a matching background color and switch the image to `object-contain` so the full artwork (including text) is always visible:

```tsx
export function SketchyArtPanel() {
  return (
    <div className="h-full w-full bg-sky-300">
      <img 
        src={authArtwork} 
        alt="A brighter day awaits - Daze" 
        className="h-full w-full object-contain object-top"
      />
    </div>
  );
}
```

- `object-contain` ensures the entire image (including the top text) is visible
- `object-top` anchors the image to the top so the tagline appears first
- `bg-sky-300` fills any letterbox gaps with a color that blends with the artwork's sky

This is a single-file, 2-line change.

