

## Add Dark Mode Toggle to Client Portal Profile Menu

### What Changes
Add a "Dark Mode" toggle switch to the user profile dropdown in the portal header (both desktop and mobile). This reuses the existing `next-themes` infrastructure already powering the admin dashboard's dark mode.

### Files Changed

| File | Change |
|------|--------|
| `src/components/portal/PortalHeader.tsx` | Add dark mode toggle item to both desktop and mobile profile dropdowns |

### Implementation Details

**`src/components/portal/PortalHeader.tsx`**

1. **Import `useTheme`** from `next-themes` and the `Moon`/`Sun` icon from `@phosphor-icons/react`
2. **Get theme state**: `const { theme, setTheme } = useTheme();`
3. **Add a toggle row** in both desktop and mobile `DropdownMenuContent`, placed between "Change Password" and "Sign Out":
   - Uses a `DropdownMenuItem` styled as a flex row with a label ("Dark Mode") on the left and a `Switch` component on the right
   - The `Switch` is checked when `theme === "dark"` and toggles between `"dark"` and `"light"`
   - Uses `onSelect={(e) => e.preventDefault()}` on the menu item to prevent the dropdown from closing when toggling
   - Uses the `Moon` icon for visual consistency

4. **No layout concerns**: The app already has full dark mode CSS support via Tailwind's `dark:` variants and the `ThemeProvider` wrapping the entire app. The portal pages use semantic color tokens (`bg-muted/30`, `text-foreground`, `bg-popover`, etc.) which automatically adapt to theme changes.

### UI in the Dropdown

```
[Avatar] User Name
         user@email.com
─────────────────────────
  Key    Change Password
  Moon   Dark Mode         [toggle]
─────────────────────────
  Exit   Sign Out
```

