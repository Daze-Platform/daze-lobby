

## Add File Removal and Additional Logo Slots

### 1. Venue Card: Add X buttons to remove uploaded menu and logo

**File: `src/components/portal/VenueCard.tsx`**

- Add `onMenuRemove` and `onLogoRemove` callback props to `VenueCardProps`
- When a menu is uploaded (`hasMenu`), overlay a small X button in the top-right corner of the menu upload area that calls `onMenuRemove`
- When a logo is uploaded (`hasLogo`), overlay a small X button in the top-right corner of the logo upload area that calls `onLogoRemove`
- Clicking X clears the local file state and triggers the parent to null out the DB field
- Stop click propagation so the X doesn't trigger the file picker

### 2. VenueManager + VenueContext: Wire up remove callbacks

**File: `src/contexts/VenueContext.tsx`**
- Add `removeMenu(venueId)` and `removeLogo(venueId)` actions to the context interface and provider

**File: `src/components/portal/VenueManager.tsx`**
- Add `handleRemoveMenu` and `handleRemoveLogo` handlers that call `updateVenue(id, { menuPdfUrl: null })` and `updateVenue(id, { logoUrl: null })` respectively
- Pass these as props to `VenueCard`

**File: `src/hooks/useClientPortal.ts`** (line ~633)
- The existing `updateVenueMutation` already supports setting `menuPdfUrl` and `logoUrl` to any value. We just need to allow `null` in the type:

```text
updates: { name?: string; menuPdfUrl?: string | null; logoUrl?: string | null }
```

**File: `src/hooks/useVenueHandlers.ts`**
- Update the `handleUpdateVenue` type to accept `null` values for `menuPdfUrl` and `logoUrl`

**File: `src/types/venue.ts`**
- Update `VenueUpdate` to allow `null` for `menuPdfUrl` and `logoUrl`

### 3. Brand Identity: Add X buttons to remove logos

**File: `src/components/portal/MultiLogoUpload.tsx`**
- Add an `onLogoRemove` callback prop: `(variant: string) => void`
- When a logo variant has an upload (file or existingUrl), show a small X button in the corner
- Clicking X clears the local state for that variant and calls `onLogoRemove(variant)` to remove it from the DB

### 4. Brand Identity: Add X button to remove brand document

**File: `src/components/portal/BrandDocumentUpload.tsx`**
- The X button already exists (`handleRemove`) but only clears local state. Add an `onRemove` callback prop that notifies the parent to clear the DB field as well.

### 5. Brand Identity: Add more logo upload slots

**File: `src/components/portal/MultiLogoUpload.tsx`**
- Add two new logo variant types beyond dark/light/icon:
  - `"wordmark"` -- "Wordmark / Text Logo" for text-based logo versions
  - `"alternate"` -- "Alternate Logo" for secondary/seasonal variants
- Update `createInitialLogos` to include these new slots
- The existing upload infrastructure (`uploadLogoMutation`) already stores logos by variant key, so no backend changes needed

### 6. PropertyBrandManager: Wire removal callbacks

**File: `src/components/portal/PropertyBrandManager.tsx`**
- Add `onLogoRemove` and `onDocumentRemove` props
- Pass `onLogoRemove` through to `MultiLogoUpload`
- Wire BrandDocumentUpload's `onRemove` to `onDocumentRemove`

**File: `src/components/portal/steps/BrandStep.tsx`**
- Add handlers for logo removal (clear variant from `logos` and `logoFilenames` maps in task data) and document removal (clear `palette_document_{propertyId}` fields)
- Pass these handlers through to `PropertyBrandManager`

### Technical Details

**Venue file removal flow:**
```text
VenueCard X button
  -> VenueManager.handleRemoveMenu(venueId)
  -> VenueContext.removeMenu(venueId)
  -> useClientPortal.updateVenue({ id, updates: { menuPdfUrl: null } })
  -> supabase.from("venues").update({ menu_pdf_url: null })
```

**Brand logo removal flow:**
```text
MultiLogoUpload X button
  -> onLogoRemove(variant)
  -> BrandStep handler
  -> Fetch fresh task data, delete variant from logos/logoFilenames maps, update DB
```

### Files to Modify
| File | Change |
|------|--------|
| `src/types/venue.ts` | Allow `null` in `VenueUpdate` |
| `src/hooks/useClientPortal.ts` | Allow `null` in venue update type |
| `src/hooks/useVenueHandlers.ts` | Allow `null` in update handler type |
| `src/contexts/VenueContext.tsx` | Add `removeMenu`/`removeLogo` actions |
| `src/components/portal/VenueManager.tsx` | Wire remove handlers |
| `src/components/portal/VenueCard.tsx` | Add X buttons for menu/logo removal |
| `src/components/portal/MultiLogoUpload.tsx` | Add X buttons + 2 new logo slots (wordmark, alternate) |
| `src/components/portal/BrandDocumentUpload.tsx` | Add `onRemove` callback prop |
| `src/components/portal/PropertyBrandManager.tsx` | Wire removal callbacks |
| `src/components/portal/steps/BrandStep.tsx` | Add removal handlers for logos and documents |

### Result
- Users can remove uploaded venue menus and logos via an X button
- Users can remove uploaded brand logos and documents via an X button
- Two additional logo upload slots (Wordmark and Alternate) are available in Brand Identity
- All removals persist to the database immediately
