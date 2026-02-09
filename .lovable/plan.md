

# Refined Brand Update: Lighter Blue + Orange Accents (No Gradients)

A streamlined color refresh that shifts the primary blue to a lighter, more airy tone while introducing orange as a clean accent color—without any gradients.

---

## Overview

This update focuses on two key changes:
1. **Lighten the primary blue** globally for a softer, more premium feel
2. **Add orange as a flat accent** for notifications, badges, and attention-grabbing elements

No gradients. Clean, solid colors only.

---

## 1. Primary Blue Color Update

### Current vs New Blue

| Mode | Current (HSL) | New (HSL) | Hex Approx |
|------|---------------|-----------|------------|
| Light | `217 91% 60%` | `205 90% 60%` | `#3AABEB` |
| Dark | `217 91% 65%` | `205 85% 65%` | `#5FBFF5` |

The new blue:
- Shifts hue from 217 (deep blue) to 205 (sky/ocean blue)
- Slightly lighter and more "airy"
- Better matches the "Daze Air" aesthetic

### Files to Update: `src/index.css`

Update these CSS variables in both `:root` and `.dark`:

```text
:root {
  --primary: 205 90% 60%;        // was 217 91% 60%
  --ring: 205 90% 60%;           // match primary
  --sidebar-primary: 205 90% 60%;
  --sidebar-ring: 205 90% 60%;
  --daze-ocean: 205 90% 60%;     // align brand color
}

.dark {
  --primary: 205 85% 65%;        // was 217 91% 65%
  --ring: 205 85% 65%;
  --sidebar-primary: 205 85% 65%;
  --sidebar-ring: 205 85% 65%;
}
```

This single change propagates throughout the entire app since all components use `bg-primary`, `text-primary`, etc.

---

## 2. Orange Accent Color (Flat, No Gradient)

### Purpose
Use orange for:
- Notification badges (new items, urgent)
- Active step indicators in progress timeline
- Attention-grabbing labels
- Sidebar "Incomplete" pulse ring (optional)

### Implementation in `src/index.css`

Ensure the accent orange variable is properly defined (already exists):
```text
--accent-orange: 24 94% 53%;   // #F97316
```

### New Badge Variant: `src/components/ui/badge.tsx`

Add an "accent" variant for orange badges:

```typescript
accent: "border-transparent bg-orange-500 text-white hover:bg-orange-500/90"
```

Usage examples:
- "NEW" labels on features
- "Urgent" task indicators
- Notification counts

---

## 3. Dashboard Stats Card Polish

### File: `src/pages/Dashboard.tsx`

Add colored top borders to stats cards for visual hierarchy:

| Card | Border Color |
|------|--------------|
| Total Clients | `border-t-4 border-t-primary` (new lighter blue) |
| Incomplete | `border-t-4 border-t-orange-500` (draws attention) |
| Devices | `border-t-4 border-t-emerald-500` (operational green) |

Migrate icons from Lucide to Phosphor duotone:
- `Building2` → `Buildings` (Phosphor)
- `AlertTriangle` → `Warning` (Phosphor)
- `Cpu` → `DeviceMobile` (Phosphor)

---

## 4. Sidebar Active Indicator Update

### File: `src/components/layout/DashboardSidebar.tsx`

Replace the current blue pill with an **orange pill** for active state:

Current:
```text
before:bg-primary
```

New:
```text
before:bg-orange-500
```

This creates visual distinction between:
- **Blue**: Primary actions (buttons, links)
- **Orange**: Current location/state indicator

---

## 5. Step Badge Active State

### File: `src/components/ui/step-badge.tsx`

Update the active step glow to use the new lighter blue:

Current uses `hsl(var(--primary)/0.3)` which will automatically update when we change the primary variable.

Optionally, add an orange accent ring for the "next action" step:
```text
status === "active" && "ring-2 ring-orange-400/40"
```

---

## 6. Button System (No Changes Needed)

The button component already uses `bg-primary` for the default variant. Once we update the CSS variable, all primary buttons will automatically use the new lighter blue.

No gradient variants will be added. The existing hover effects (translate + shadow) provide sufficient feedback.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Update `--primary`, `--ring`, `--sidebar-primary` to lighter blue (hue 205) |
| `src/components/ui/badge.tsx` | Add "accent" variant with `bg-orange-500` |
| `src/pages/Dashboard.tsx` | Add colored top borders, migrate to Phosphor icons |
| `src/components/layout/DashboardSidebar.tsx` | Change active pill from blue to orange |
| `src/components/ui/step-badge.tsx` | Migrate icons to Phosphor (Check → Check from Phosphor) |

---

## Color Summary

| Element | Color |
|---------|-------|
| Primary buttons | Lighter blue (solid) |
| Links | Lighter blue |
| Sidebar active pill | Orange (solid) |
| Notification badges | Orange (solid) |
| "Incomplete" card border | Orange |
| Active step glow | Lighter blue with orange ring |
| Success states | Emerald green |
| Error states | Rose red |

No gradients anywhere. Clean, flat colors with subtle shadows for depth.

---

## Visual Preview (ASCII)

```text
Dashboard Stats Cards:
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│▄▄▄▄ BLUE ▄▄▄▄▄▄▄▄│ │▄▄▄▄ ORANGE ▄▄▄▄▄│ │▄▄▄▄ GREEN ▄▄▄▄▄▄│
│ Total Clients    │ │ Incomplete       │ │ Devices          │
│      12          │ │      5           │ │      28          │
└──────────────────┘ └──────────────────┘ └──────────────────┘

Sidebar Active State:
┌────────────────────────┐
│ ┃ Dashboard      ← Orange pill
│   Clients [12]
│   Incomplete [5] 🟠 ← Orange badge
│   Devices [28]
└────────────────────────┘
```

