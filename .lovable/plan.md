

# POS Provider Dropdown with Logos

## Overview

Transform the POS provider selection from a 2x2 button grid to a polished Select dropdown with official POS provider logos displayed alongside provider names.

## Current Implementation

The `PosStep.tsx` component currently uses:
- A grid of 4 `motion.button` elements arranged in a 2x2 layout
- Each provider shows a Lucide icon (Utensils, Cpu, Tablet, Smartphone) instead of actual logos
- Selecting a provider triggers a slide animation to show integration instructions

## Proposed Changes

### 1. Add POS Provider Logo Assets

Create a new directory `public/pos-logos/` and add official logos for each provider:

| Provider | File | Source |
|----------|------|--------|
| Toast | `toast.svg` | Orange flame icon from Toast brand assets |
| Oracle MICROS | `oracle-micros.svg` | Red Oracle "O" with MICROS text |
| NCR Aloha | `ncr-aloha.svg` | NCR Voyix green brand mark |
| Lavu | `lavu.svg` | Lavu blue text logo |

Logo specifications:
- Format: SVG (scalable, small file size)
- Size: ~24px display height in dropdown
- Transparent background

### 2. Update `PosStep.tsx` Component

**Remove:**
- The 2x2 grid of `motion.button` elements
- Lucide icon imports for placeholder icons (Utensils, Cpu, Tablet, Smartphone)

**Add:**
- Import Select components from `@/components/ui/select`
- Replace grid with a single `Select` dropdown

**Updated PROVIDERS array:**
```typescript
const PROVIDERS = [
  {
    id: "toast" as const,
    name: "Toast",
    logo: "/pos-logos/toast.svg",
  },
  {
    id: "micros" as const,
    name: "Oracle MICROS",
    logo: "/pos-logos/oracle-micros.svg",
  },
  {
    id: "ncr" as const,
    name: "NCR Aloha",
    logo: "/pos-logos/ncr-aloha.svg",
  },
  {
    id: "lavu" as const,
    name: "Lavu",
    logo: "/pos-logos/lavu.svg",
  },
];
```

**Dropdown implementation:**
```tsx
<Select 
  value={selectedProvider || ""} 
  onValueChange={(value) => handleProviderSelect(value as PosProvider)}
>
  <SelectTrigger className="h-12 text-left">
    <SelectValue placeholder="Select your POS provider" />
  </SelectTrigger>
  <SelectContent>
    {PROVIDERS.map((provider) => (
      <SelectItem key={provider.id} value={provider.id}>
        <div className="flex items-center gap-3">
          <img 
            src={provider.logo} 
            alt={`${provider.name} logo`}
            className="w-6 h-6 object-contain"
          />
          <span className="font-medium">{provider.name}</span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 3. UI Flow Changes

**Before (grid selection):**
1. User sees 4-button grid
2. User clicks a button
3. View animates to instructions panel

**After (dropdown selection):**
1. User sees a dropdown with placeholder text
2. User opens dropdown, sees providers with logos
3. User selects provider
4. View animates to instructions panel (same as before)

### 4. Instructions Panel Update

Update the header section to show the logo instead of a Lucide icon:
```tsx
<div className="flex items-center gap-3">
  {providerInfo && (
    <img 
      src={providerInfo.logo} 
      alt={`${providerInfo.name} logo`}
      className="w-10 h-10 object-contain"
    />
  )}
  <h3 className="font-semibold text-lg">{instructions?.headline}</h3>
</div>
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `public/pos-logos/toast.svg` | Create - Toast logo |
| `public/pos-logos/oracle-micros.svg` | Create - Oracle MICROS logo |
| `public/pos-logos/ncr-aloha.svg` | Create - NCR Aloha logo |
| `public/pos-logos/lavu.svg` | Create - Lavu logo |
| `src/components/portal/steps/PosStep.tsx` | Modify - Replace grid with Select dropdown |

## Visual Comparison

**Current Grid:**
```text
+---------------+---------------+
|     (icon)    |     (icon)    |
|     Toast     | Oracle MICROS |
+---------------+---------------+
|     (icon)    |     (icon)    |
|   NCR Aloha   |     Lavu      |
+---------------+---------------+
```

**New Dropdown:**
```text
+------------------------------------------+
| [Select icon] Select your POS provider ▼ |
+------------------------------------------+
           |
           v (when open)
+------------------------------------------+
| [Toast logo]        Toast                |
| [MICROS logo]       Oracle MICROS        |
| [NCR logo]          NCR Aloha            |
| [Lavu logo]         Lavu                 |
+------------------------------------------+
```

## Benefits

1. **Cleaner UI**: Single dropdown vs 4 buttons reduces visual clutter
2. **Authentic branding**: Official logos build trust with hospitality clients
3. **Scalability**: Easy to add more POS providers in the future
4. **Consistency**: Matches the Select pattern already used in NewClientModal
5. **Mobile-friendly**: Dropdown works better on small screens than a grid

