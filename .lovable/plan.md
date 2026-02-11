

## Save File Names and Persist Document Uploads

### Problem
1. **File names are lost on reload**: When logos or brand documents are uploaded, only the storage path/URL is saved to the database -- not the original file name. On reload, `BrandDocumentUpload` shows generic text like "Color palette document" instead of the actual file name, and `MultiLogoUpload` loses filename display entirely.
2. **Brand document uploads don't persist visually**: The `BrandDocumentUpload` component relies on `selectedFile` (in-memory `File` object) for display. On reload, the `File` is gone and only `existingUrl` remains, so there's no filename to show.

### Solution

#### 1. Store original file names alongside paths in `uploadFileMutation`
**File: `src/hooks/useClientPortal.ts`**

In `uploadFileMutation`, save both the file path and the original filename to the task data:
```text
// Currently:
data: { ...existingData, [fieldName]: filePath }

// Change to:
data: { ...existingData, [fieldName]: filePath, [`${fieldName}_filename`]: file.name }
```

#### 2. Store original file names alongside URLs in `uploadLogoMutation`
**File: `src/hooks/useClientPortal.ts`**

In `uploadLogoMutation`, save logo filenames in a parallel `logoFilenames` map:
```text
data: {
  ...existingData,
  logos: { ...existingLogos, [variant]: urlData?.publicUrl },
  logoFilenames: { ...existingLogoFilenames, [variant]: file.name }
}
```

#### 3. Hydrate palette document filename in `BrandStep`
**File: `src/components/portal/steps/BrandStep.tsx`**

Add a helper `getPaletteDocumentFilename` that reads `palette_document_{propertyId}_filename` from task data, and pass it through to `PropertyBrandManager` and `BrandDocumentUpload` via a new `paletteDocumentFilename` field on `PropertyBrand`.

#### 4. Update `BrandDocumentUpload` to accept and display `existingFilename`
**File: `src/components/portal/BrandDocumentUpload.tsx`**

Add an `existingFilename` prop. When there's an `existingUrl` but no `selectedFile`, display `existingFilename` (or fallback to "Brand guidelines document").

#### 5. Update `MultiLogoUpload` to accept and display saved filenames
**File: `src/components/portal/MultiLogoUpload.tsx`**

Add an `existingFilenames` prop (`Record<string, string>`). When a logo has an `existingUrl` but no `File`, display the saved filename.

#### 6. Pass filenames through the component chain
**Files: `PropertyBrandManager.tsx`, `PropertyBrand` type**

- Add `logoFilenames?: Record<string, string>` and `paletteDocumentFilename?: string` to the `PropertyBrand` interface.
- Thread filenames from hydrated data through `PropertyBrandManager` to `MultiLogoUpload` and `BrandDocumentUpload`.

### Files to Modify
| File | Change |
|------|--------|
| `src/hooks/useClientPortal.ts` | Store `_filename` keys in both `uploadFileMutation` and `uploadLogoMutation` |
| `src/components/portal/steps/BrandStep.tsx` | Hydrate filename fields from task data |
| `src/components/portal/PropertyBrandManager.tsx` | Add filename fields to `PropertyBrand` interface, pass to children |
| `src/components/portal/BrandDocumentUpload.tsx` | Accept `existingFilename` prop, display it on reload |
| `src/components/portal/MultiLogoUpload.tsx` | Accept `existingFilenames` prop, display saved names |

### Result
- Original filenames persist across reloads and sessions for all upload types (logos, brand documents, generic file uploads)
- Users see meaningful filenames instead of generic placeholders after returning to the portal

