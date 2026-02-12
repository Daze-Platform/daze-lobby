

# Plush Dark Mode Polish for Admin Dashboard

## Overview

The dark mode CSS variables and ThemeProvider are already wired up, but many components use hardcoded light-mode colors (white overlays, slate-900 text, light gradient stops) that don't adapt in dark mode. This plan addresses every surface in the admin dashboard to ensure a seamless, premium dark experience that mirrors the light mode's "Series C SaaS" aesthetic.

## Changes by File

### 1. `src/index.css` -- Glass & Ambient System

**Glass header/sidebar**: Replace hardcoded `hsl(0 0% 100% / 0.2)` borders with theme-aware values using `.dark` overrides.

- `.glass-header` and `.glass-sidebar` get `.dark &` rules with darker backdrop tints and subtle white/5 borders instead of white/20
- `.bg-ambient` gets a dark companion using deep navy radials (already defined as `.bg-ambient-dark` but never used -- will be integrated)
- `.card-floating` shadow system gets dark-aware shadow colors
- Device card gradient overlay (`from-white/5`) will be addressed in component files
- Add a utility `.glass-border-dark` for dark glass edges

### 2. `src/components/layout/DashboardLayout.tsx`

- Add `dark:bg-background` to the root container to ensure the deep navy base shows through instead of `bg-muted/30` looking washed out

### 3. `src/components/layout/DashboardHeader.tsx`

- The header already uses `glass-header` -- no component changes needed once CSS is updated
- The Daze logo image may need a `dark:brightness-110` or `dark:invert` filter if it's too dark on dark backgrounds (will check)

### 4. `src/components/layout/DashboardSidebar.tsx`

- Sidebar uses `bg-card` and `border-border/40` which adapt via CSS variables -- mostly fine
- The collapse toggle button uses `bg-card shadow-soft` -- add `dark:shadow-none dark:border-border/60` for cleaner dark edges
- The "Daze Control Tower" footer text uses `/50` opacity which works in both modes

### 5. `src/components/kanban/KanbanColumn.tsx`

- `PHASE_COLORS` icon backgrounds use hardcoded light colors (e.g., `bg-blue-500/10 text-blue-600`). Add dark variants:
  - `bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400`
  - Same pattern for purple, amber, emerald
- Column header `bg-card` and droppable zone `bg-muted/30` adapt via variables -- good
- Empty state icons using `opacity-20` will work

### 6. `src/components/kanban/HotelCard.tsx`

- The "Liquid Glass Overlay" div uses `from-white/5` -- change to `from-white/5 dark:from-white/[0.02]` for subtlety in dark mode
- Blocked card `bg-destructive/5` -- add `dark:bg-destructive/10` for visibility
- Drag overlay card shadow is inline CSS with `rgba(0,0,0,0.25)` -- increase to `0.5` in dark or use a CSS variable approach

### 7. `src/pages/Dashboard.tsx`

- Stat cards use `border-t-4` with color classes (`border-t-primary`, `border-t-orange-500`, `border-t-emerald-500`) -- these are Tailwind colors that work in both modes
- `hover:shadow-soft-lg` -- will adapt once CSS shadows are updated

### 8. `src/pages/Clients.tsx`

- Phase badges already have `dark:` variants defined -- good
- Client cards use standard `Card` component with CSS variable backgrounds
- Hover states like `hover:bg-amber-50 dark:hover:bg-amber-950/30` already present in some places -- consistent

### 9. `src/pages/Devices.tsx`

- Device card `bg-card/60 backdrop-blur-sm` works with dark CSS vars
- The gradient overlay `from-white/5` needs `dark:from-white/[0.02]`
- Device icon container `from-primary/15 to-primary/5` and `ring-primary/10` adapt via CSS vars
- Battery/signal indicators use semantic Tailwind colors -- work in both modes
- Search/filter bar `bg-card/60` adapts

### 10. `src/pages/Revenue.tsx`

- Uses standard Card components and CSS variable colors -- largely adapts
- Revenue badge uses `bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400` -- already has dark variants

### 11. `src/pages/Blockers.tsx`

- Already has dark variants on watchdog severity badges
- Standard card/badge usage adapts via variables

### 12. `src/components/settings/SettingsDialog.tsx`

- Dialog uses `bg-background/95 backdrop-blur-xl` -- adapts via CSS vars
- Section backgrounds `bg-muted/30` adapt
- Password form `bg-background/50` adapts
- Switch component checked state should already handle dark mode via Radix primitives

### 13. `src/components/modals/NewClientModal.tsx`

- Uses standard shadcn Dialog -- adapts via CSS variables
- Input `bg-background/80` adapts

## Technical Details

### CSS Variable System (already working)

The `.dark` class in `index.css` already redefines all core variables (background, card, popover, border, etc.) with appropriate dark values. The key gap is the **utility classes** and **inline color references** that bypass this system.

### Files Modified (10 files)

1. `src/index.css` -- Dark-aware glass, ambient, shadow utilities
2. `src/components/layout/DashboardLayout.tsx` -- Dark background class
3. `src/components/layout/DashboardSidebar.tsx` -- Dark collapse button styling
4. `src/components/layout/DashboardHeader.tsx` -- Logo dark mode filter
5. `src/components/kanban/KanbanColumn.tsx` -- Phase icon dark color variants
6. `src/components/kanban/HotelCard.tsx` -- Glass overlay and blocked state dark variants
7. `src/pages/Dashboard.tsx` -- Minor dark shadow adjustments
8. `src/pages/Devices.tsx` -- Glass overlay dark variant
9. `src/components/settings/SettingsDialog.tsx` -- Minor polish
10. `src/components/dashboard/ClientDetailPanel.tsx` -- Ensure panel adapts

### No Database or Backend Changes Required

