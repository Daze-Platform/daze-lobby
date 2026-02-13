

## Display Uploaded Filenames in Venue Cards

### Problem
When clients upload logos in the Venue Manager step, the UI shows "Logo uploaded" and "Additional logo uploaded" but never displays the actual filename (e.g., "hotel-logo.png"). This makes it hard for users to verify which file they uploaded, especially after a page reload.

### Solution
Show the uploaded filename below the "Logo uploaded" confirmation text in the VenueCard component. Since venue logos are stored via Supabase Storage (not JSONB task data), the filename needs to be extracted from the storage URL or tracked locally from the File object.

### Technical Changes

**File: `src/types/venue.ts`**
- Add optional `logoFileName` and `additionalLogoFileName` fields to the `Venue` interface

**File: `src/components/portal/VenueCard.tsx`**
- For the primary logo: show `venue.logoFile?.name` (for freshly selected files) or `venue.logoFileName` (for persisted uploads) below the "Logo uploaded" text
- For the additional logo: same pattern with `venue.additionalLogoFileName`
- Display as a truncated `text-xs text-muted-foreground` line, matching the style already used in `MultiLogoUpload`

**File: `src/contexts/VenueContext.tsx`** (or wherever venues are hydrated from DB)
- When building `Venue` objects from database rows, extract the filename from the storage URL (the last path segment) and populate the new `logoFileName` / `additionalLogoFileName` fields
- When a new logo is uploaded, capture `file.name` into the venue state

### What Users Will See
- After uploading a venue logo: "Logo uploaded" + the filename (e.g., "hotel-pool-bar-logo.png") displayed underneath
- After page reload: the persisted filename extracted from the storage path is shown
- Same for additional logos

| File | Change |
|------|--------|
| `src/types/venue.ts` | Add `logoFileName?` and `additionalLogoFileName?` fields |
| `src/components/portal/VenueCard.tsx` | Display filename text below "Logo uploaded" for both logo slots |
| `src/contexts/VenueContext.tsx` | Extract and populate filenames when hydrating venues from DB |

