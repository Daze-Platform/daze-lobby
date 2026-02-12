

# Implement Dark Mode for Admin Dashboard

## Current State

The project already has most of the groundwork in place:
- Dark mode CSS variables are fully defined in `index.css` (`.dark` class)
- Tailwind is configured with `darkMode: ["class"]`
- `next-themes` is installed and imported in SettingsDialog
- The dark mode toggle exists in Settings and calls `setTheme()`

However, two issues prevent it from working:
1. **No `ThemeProvider`** wrapping the app -- so `useTheme()` has no context
2. **Line 125 in `index.css`** forces `html { @apply dark; }`, which hardcodes dark mode regardless of the toggle

## Changes

### 1. Remove forced dark class from CSS
**File: `src/index.css` (line 124-126)**
- Remove `html { @apply dark; }` so that `next-themes` can control the class on `<html>` dynamically

### 2. Wrap the app with ThemeProvider
**File: `src/App.tsx`**
- Import `ThemeProvider` from `next-themes`
- Wrap the app tree with `<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>`
- This tells `next-themes` to toggle the `dark` class on `<html>` and default to light mode

### 3. Sync theme on login (profile fetch)
**File: `src/components/settings/SettingsDialog.tsx`**
- The existing `handleDarkModeToggle` and `fetchProfile` logic already syncs the `dark_mode` profile field with `setTheme()` -- this will now work correctly with `ThemeProvider` in place

## How It Works

When the admin toggles Dark Mode in Settings:
1. `setTheme("dark")` is called, which adds `class="dark"` to `<html>`
2. All Tailwind `dark:` variants and CSS variable overrides activate instantly
3. The preference is saved to the `profiles` table via the Save button
4. On next login, the saved preference is loaded and applied

The client portal is unaffected since it uses separate routes and does not share the admin settings context.

## Technical Details

- **No database changes needed** -- `dark_mode` column already exists on `profiles`
- **No new dependencies** -- `next-themes` is already installed
- Only 2 files need editing, with minimal changes

