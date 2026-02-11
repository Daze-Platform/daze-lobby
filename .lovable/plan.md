

# Fix Brand Logo Persistence on Refresh

## Problem
Brand logos disappear on page refresh because of a mismatch between how they're stored and retrieved.

- **Write path**: Logos are saved as `data["logo_{propertyId}_{variant}"]` = file path (via `uploadFileMutation`)
- **Read path**: `BrandStep.getLogoUrls()` looks inside `data.logos` object for matching keys, and treats values as URLs

This means logos are never found on reload.

## Root Cause
Two separate bugs in `src/components/portal/steps/BrandStep.tsx`:

1. **Wrong lookup location**: `getLogoUrls()` searches `data.logos` but the upload stores at `data["logo_{propertyId}_{variant}"]` (top-level)
2. **Path vs URL**: The stored value is a storage file path, not a public URL. `getPaletteDocumentUrl` correctly constructs the full URL from the path, but `getLogoUrls` does not.

## Fix

### File: `src/components/portal/steps/BrandStep.tsx`

Rewrite `getLogoUrls()` to:
1. Search top-level keys in `taskData` for keys matching `logo_{propertyId}_{variant}`
2. Convert file paths to full public URLs (same pattern as `getPaletteDocumentUrl`)
3. Keep fallback support for the legacy `data.logos` format

```
const getLogoUrls = (propertyId: string, taskData?: Record<string, unknown>): Record<string, string> => {
    if (!taskData) return {};
    const result: Record<string, string> = {};

    // Primary: look at top-level keys like "logo_{propertyId}_{variant}" (stored by uploadFileMutation)
    const propertyPrefix = `logo_${propertyId}_`;
    for (const [key, value] of Object.entries(taskData)) {
      if (key.startsWith(propertyPrefix) && typeof value === "string") {
        const variant = key.substring(propertyPrefix.length);
        // Value is a file path, construct full URL
        result[variant] = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/onboarding-assets/${value}`;
      }
    }

    // Fallback: legacy data.logos format (full URLs)
    const logos = (taskData.logos || {}) as Record<string, string>;
    for (const [key, url] of Object.entries(logos)) {
      const legacyPrefix = `logo_${propertyId}_`;
      if (key.startsWith(legacyPrefix)) {
        const variant = key.substring(legacyPrefix.length);
        if (!result[variant]) result[variant] = url;
      } else if (!key.startsWith("logo_") && ["dark", "light", "icon"].includes(key)) {
        if (!result[key]) result[key] = url;
      }
    }

    return result;
  };
```

## Scope
- **1 file changed**: `src/components/portal/steps/BrandStep.tsx` (the `getLogoUrls` helper function)
- No database or storage changes needed -- uploads already work correctly
- Venue uploads (menus, logos) already persist fine via dedicated DB columns

