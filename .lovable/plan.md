
# Persist and Display Uploaded Assets in Client Portal

## Problem
When clients upload logos, colors, or documents in the Brand Identity step, the data is saved to the database correctly. However, when they return to the portal later, **previously uploaded logos don't appear in the UI** - the upload boxes appear empty, making it seem like nothing was saved.

The same issue affects other uploads across the onboarding steps (brand documents, venue logos, venue menus).

## Root Cause Analysis

The upload flow currently works like this:
1. User uploads a file in `MultiLogoUpload`
2. File is stored in local component state as a `File` object with a preview
3. On save, the file is uploaded to Supabase Storage
4. The resulting URL is saved to `onboarding_tasks.data.logos.{variant}`

**However**, when the page reloads:
1. `MultiLogoUpload` initializes with empty state (no Files)
2. The saved `logoUrls` exist in `PropertyBrand.logoUrls` but aren't passed to `MultiLogoUpload`
3. The upload boxes appear empty despite data being saved

## Solution

Update components to accept and display existing URLs from the database:

### 1. MultiLogoUpload Component
**File:** `src/components/portal/MultiLogoUpload.tsx`

- Add `existingUrls?: Record<string, string>` prop
- Initialize state to show existing URLs as previews
- Display saved logos with visual indicator that they're already uploaded
- Allow re-uploading to replace existing logos

### 2. PropertyBrandManager Component  
**File:** `src/components/portal/PropertyBrandManager.tsx`

- Pass `existingUrls={property.logoUrls}` to `MultiLogoUpload`
- Ensure the component correctly merges saved URLs with new uploads

### 3. VenueCard Component (if applicable)
**File:** `src/components/portal/VenueCard.tsx`

- Verify venue logos and menus display their saved URLs on reload
- Add visual preview of uploaded files

---

## Technical Details

### MultiLogoUpload Changes

```text
Before:
- interface MultiLogoUploadProps { onLogosChange: (logos: Record<string, File>) => void }
- Initializes logos state with empty file slots

After:
- interface MultiLogoUploadProps { 
    onLogosChange: (logos: Record<string, File>) => void;
    existingUrls?: Record<string, string>;  // URLs already saved
  }
- Initialize state with existing URLs as previews
- Show saved logos with "Uploaded" badge
- New uploads replace existing ones
```

### State Structure
```text
interface LogoVariant {
  type: "dark" | "light" | "icon";
  label: string;
  description: string;
  file?: File;           // New upload (takes priority)
  preview?: string;      // Base64 preview of new file
  existingUrl?: string;  // Previously saved URL from database
}
```

### Display Logic
- If `file` exists: show base64 preview (new upload pending save)
- Else if `existingUrl` exists: show the saved image URL
- Else: show upload placeholder

### PropertyBrandManager Integration
```text
<MultiLogoUpload
  onLogosChange={(logos) => handleLogosChange(property.id, logos)}
  existingUrls={property.logoUrls}  // Pass saved URLs
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/portal/MultiLogoUpload.tsx` | Add `existingUrls` prop, initialize from saved data, display existing uploads |
| `src/components/portal/PropertyBrandManager.tsx` | Pass `logoUrls` to `MultiLogoUpload` |

## Outcome
After these changes:
- Clients will see their previously uploaded logos when they return to the portal
- Clear visual feedback shows what's already uploaded vs. what needs to be done
- The "Uploaded" indicator persists across sessions
- Re-uploading a logo replaces the existing one
