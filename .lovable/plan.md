

# Increase Logo Size in Portal Preview

## Current State
The logo next to "PREVIEW MODE" is currently set to `h-8` (32px height) on line 86:
```tsx
<img src={dazeLogo} alt="Daze" className="h-8 w-auto" />
```

## Change Required
Increase the height by 25px: 32px + 25px = 57px

Since Tailwind doesn't have a built-in class for exactly 57px, we'll use an arbitrary value: `h-[57px]`

## Implementation

| File | Change |
|------|--------|
| `src/pages/PortalPreview.tsx` | Line 86: Change `h-8` to `h-[57px]` |

**Before:**
```tsx
<img src={dazeLogo} alt="Daze" className="h-8 w-auto" />
```

**After:**
```tsx
<img src={dazeLogo} alt="Daze" className="h-[57px] w-auto" />
```

