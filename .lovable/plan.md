

# Brand Palette Picker Enhancement

## Overview

Improve the brand color palette interface by adding a visual "OR" separator between the document upload option and the manual color picker, making it clear that users only need to complete one of the two options.

## Current State

The `BrandStep.tsx` component currently shows:
1. Multi Logo Upload
2. Brand Document Upload (palette document)
3. Color Palette Manager (manual picker)

The document upload and color picker are shown sequentially without any indication that they are alternative options.

## Proposed Changes

### 1. Create an "OR" Divider Component

**New File:** `src/components/ui/or-divider.tsx`

A reusable divider with "OR" text centered between two horizontal lines:

```tsx
import { Separator } from "@/components/ui/separator";

interface OrDividerProps {
  className?: string;
}

export function OrDivider({ className }: OrDividerProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Separator className="flex-1" />
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        or
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
```

### 2. Improve Color Palette Manager

**File:** `src/components/portal/ColorPaletteManager.tsx`

Enhancements:
- Add clearer visual hierarchy with a card-like container
- Improve the color input UX with better touch targets
- Add hex code validation for manual input
- Show a more prominent empty state when no colors are added
- Add subtle animations when adding/removing colors

Key improvements:
```tsx
// Better color swatch with improved touch target
<div className="flex items-center gap-3 p-3 border rounded-xl bg-card shadow-sm">
  <button
    type="button"
    className="relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer ring-2 ring-border hover:ring-primary transition-all"
    onClick={() => /* open color picker */}
  >
    <div className="absolute inset-0" style={{ backgroundColor: color }} />
    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" />
  </button>
  {/* ... */}
</div>

// Better hex input with validation
<Input
  value={color}
  onChange={(e) => {
    const value = e.target.value;
    // Only update if valid hex or partial hex
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
      updateColor(index, value);
    }
  }}
  placeholder="#3B82F6"
  className="w-24 h-7 text-xs font-mono uppercase"
/>
```

### 3. Update BrandStep Layout

**File:** `src/components/portal/steps/BrandStep.tsx`

Add the OR divider between document upload and color picker:

```tsx
<div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
  {/* Multi Logo Upload */}
  <MultiLogoUpload onLogosChange={handleLogosChange} />

  {/* Color Palette Section with OR separator */}
  <div className="space-y-4">
    <p className="text-sm font-medium">Brand Colors</p>
    <p className="text-xs text-muted-foreground">
      Upload your brand guidelines document or manually define your color palette below.
    </p>
    
    {/* Option 1: Document Upload */}
    <BrandDocumentUpload
      onUpload={handleDocumentUpload}
      existingUrl={paletteDocumentUrl}
      isUploading={isUploadingDocument}
      label="Upload Brand Guidelines"
      description="PDF, PNG, or image with your official color palette"
    />

    {/* OR Divider */}
    <OrDivider />

    {/* Option 2: Manual Color Picker */}
    <ColorPaletteManager 
      colors={colors} 
      onChange={setColors} 
      maxColors={5}
    />
  </div>

  <SaveButton ... />
</div>
```

### 4. Update BrandDocumentUpload Copy

**File:** `src/components/portal/BrandDocumentUpload.tsx`

Update default label and description to better reflect its role as an option:
- Label: "Upload Brand Guidelines" → more descriptive
- Description: Clarify this is for existing brand assets

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/ui/or-divider.tsx` | Create - Reusable OR separator component |
| `src/components/portal/ColorPaletteManager.tsx` | Modify - Improve UX with better touch targets, validation |
| `src/components/portal/steps/BrandStep.tsx` | Modify - Add OR divider, reorganize layout |
| `src/components/portal/BrandDocumentUpload.tsx` | Modify - Update default copy (optional) |

## Visual Mockup

```text
┌─────────────────────────────────────────────────────────┐
│  Brand Colors                                           │
│  Upload your brand guidelines or manually define below. │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📄 Upload Brand Guidelines                      │   │
│  │     PDF, PNG, or image with your color palette   │   │
│  │                                                  │   │
│  │       [Click to upload] or drag and drop         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────────────── OR ───────────────────            │
│                                                         │
│  🎨 Brand Color Palette (2/5)                          │
│                                                         │
│  ┌────────┐  ┌────────┐  ┌─ ─ ─ ─ ┐                    │
│  │ ████   │  │ ████   │  │ + Add  │                    │
│  │Primary │  │Second. │  └─ ─ ─ ─ ┘                    │
│  │#3B82F6 │  │#F97316 │                                │
│  └────────┘  └────────┘                                │
│                                                         │
│  Palette Preview                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ████████████████████ │ ████████████████████████  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Color Palette Manager Improvements

1. **Larger touch targets**: Color swatches increase to 48px × 48px (from 40px)
2. **Better visual feedback**: Ring animation on hover/focus
3. **Hex validation**: Only accepts valid hex color formats
4. **Cleaner layout**: Card-style containers with subtle shadows
5. **Empty state**: When no colors, show a friendly prompt to add first color
6. **Responsive**: Wraps nicely on mobile screens

## UX Benefits

1. **Clear alternative options**: Users immediately understand they can choose either method
2. **Reduced cognitive load**: "OR" separator eliminates confusion about requirements
3. **Improved accessibility**: Larger touch targets for color selection
4. **Professional appearance**: Matches the Series C SaaS aesthetic with soft shadows and clean typography

