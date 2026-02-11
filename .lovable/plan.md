

## Fix Progress Ring Beam Position

### Problem
The glowing "beam" dot on the ProgressRing appears at the wrong position along the arc. At 80%, it should sit at the leading tip (near where 100% would be), but it currently appears offset because the -90 degree rotation is applied twice: once in the `progressAngle` calculation and again via the CSS `transform -rotate-90` class on the SVG element.

### Fix
**File: `src/components/portal/ProgressRing.tsx`**

Change the `progressAngle` calculation from:
```text
const progressAngle = (progress / 100) * 360 - 90;
```
to:
```text
const progressAngle = (progress / 100) * 360;
```

The CSS class `-rotate-90` on the `<svg>` element already rotates the entire coordinate system so that 0% starts at the top (12 o'clock). The `tipX`/`tipY` values are computed in SVG-local space and then the CSS rotation shifts them visually. Subtracting 90 in the angle formula causes a double offset, placing the dot roughly 90 degrees behind where it should be.

### Result
- At 80%, the beam will appear at the tip of the arc, just before the gap leading to 100%.
- At low percentages, the beam will sit just past the 12 o'clock start.
- No other files are affected. The glow filter, pulse animation, and conditional visibility (only shown when 0 < progress < 100 and not live) remain unchanged.

