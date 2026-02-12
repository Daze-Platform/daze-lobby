

# Fix: Artwork Panel -- Remove Background Color, Use object-cover with Top Alignment

## Problem

The previous fix changed the image to `object-contain` and added a `bg-sky-300` background. This creates an ugly solid blue band around the artwork that doesn't match the actual image gradient. The image no longer fills its container edge-to-edge.

## Solution

Revert to `object-cover` so the image fills the panel completely with no gaps, but use `object-top` to anchor the visible crop area to the top of the image. This ensures the tagline text ("A brighter day awaits" / "Effortless service, floating on air.") is always visible, while the bottom of the image (the sun) gets cropped on shorter viewports -- which is acceptable since the text is the priority.

Remove the `bg-sky-300` background entirely since `object-cover` fills the container with no letterboxing.

## Changes

### `src/components/auth/SketchyArtPanel.tsx`

```tsx
export function SketchyArtPanel() {
  return (
    <div className="h-full w-full">
      <img 
        src={authArtwork} 
        alt="A brighter day awaits - Daze" 
        className="h-full w-full object-cover object-top"
      />
    </div>
  );
}
```

- `object-cover` -- image fills container edge-to-edge, no background gaps
- `object-top` -- crops from the bottom, keeping the top text visible
- Removed `bg-sky-300` -- no longer needed since there are no gaps to fill

