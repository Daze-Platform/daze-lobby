
# UI Polish Audit: Control Tower and Client Portal

## Summary

After a thorough visual inspection and code review, here are the areas that could benefit from refinement, organized by impact.

---

## Control Tower Improvements

### 1. Revenue Page Uses Mock/Hardcoded Data
The Revenue page (`Revenue.tsx`) displays hardcoded mock data ("Royal Plaza Hotel", "Grand Metropolitan", etc.) with fake ARR values and trends. This violates the production-ready aesthetic mandate and should either be wired to real data from the `clients` table (which already has an `arr` column) or hidden from the sidebar until real data is available.

### 2. Kanban Card Uses Lucide Icons Instead of Phosphor
`HotelCard.tsx` imports `AlertTriangle`, `Cpu`, `GripVertical`, `Lock`, `DollarSign` from `lucide-react` instead of the project-standard Phosphor Duotone library. This creates visual inconsistency -- all other components use Phosphor icons with the duotone weight and 1.5px stroke aesthetic.

### 3. Kanban Column Header Uses Lucide Icons
`KanbanColumn.tsx` imports `Rocket`, `Play`, `CheckCircle2` from `lucide-react` for phase icons. These should be migrated to Phosphor equivalents (`RocketLaunch`, `Play`, `CheckCircle`) for consistency with the rest of the dashboard.

### 4. Dashboard Header -- Missing "Incomplete" Badge Count
The sidebar shows "Incomplete" with a count badge, but the Blockers page header badge reads "0 Active" in red even when there are zero blockers. This destructive-styled "0 Active" badge is unnecessarily alarming. When zero, it could display a calmer success variant or be hidden entirely.

### 5. Devices Page -- Delete Button Only Visible on Hover
Per the memory on responsiveness, hover-only actions should be always visible on mobile/touch. The device card delete button uses `opacity-0 group-hover:opacity-100` which makes it invisible on tablets and phones.

---

## Client Portal Improvements

### 6. Portal Mobile Bottom Nav Uses Lucide Icons
The mobile bottom navigation (`Portal.tsx` lines 436-498) imports `ClipboardList`, `FileText`, `Clock`, `LogOut`, `Target` from `lucide-react` instead of Phosphor. This should use `ClipboardText`, `FileText`, `Clock`, `SignOut`, `Target` from `@phosphor-icons/react` for consistency with the portal header.

### 7. Progress Card "In Review" Badge Lacks Visual Distinction
The "In Review" status badge on the progress ring card is plain text inside a default outline. It could benefit from a colored variant matching the phase color system (violet for reviewing) to give it more visual weight and clarity.

---

## Technical Details

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Revenue.tsx` | Replace mock data with real client ARR query, or hide the page until data exists |
| `src/components/kanban/HotelCard.tsx` | Replace Lucide imports (`AlertTriangle`, `Cpu`, `GripVertical`, `Lock`, `DollarSign`) with Phosphor equivalents (`WarningCircle`, `Cpu`, `DotsSixVertical`, `Lock`, `CurrencyDollar`) using duotone weight |
| `src/components/kanban/KanbanColumn.tsx` | Replace Lucide imports (`Rocket`, `Play`, `CheckCircle2`) with Phosphor equivalents (`RocketLaunch`, `Play`, `CheckCircle`) |
| `src/pages/Blockers.tsx` | When blocker count is 0, show a neutral/success badge variant instead of destructive red |
| `src/pages/Devices.tsx` | Add `sm:opacity-0 sm:group-hover:opacity-100` to delete button (always visible on mobile, hover-reveal on desktop) |
| `src/pages/Portal.tsx` | Replace Lucide bottom-nav icons with Phosphor Duotone equivalents |
| `src/pages/Portal.tsx` | Add phase-colored variant to the "In Review" status badge on the progress card |

### Priority Order
1. Revenue page mock data removal (production-ready mandate)
2. Icon consistency (Kanban cards + columns + portal bottom nav)
3. Blocker badge zero-state refinement
4. Device delete button touch accessibility
5. Status badge visual distinction
