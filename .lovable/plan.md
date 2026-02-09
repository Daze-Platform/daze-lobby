

## Rename "Icon/Favicon" to "Additional Logos" in Brand Identity

**What changes:**
The third logo upload slot in the Brand Identity step (currently labeled "Icon/Favicon" with a "Square format, 512x512+" description) will be renamed to "Additional Logos" with updated copy. This allows clients to upload extra brand assets that admins can extract for guest-facing interfaces and marketing materials.

**File to update:** `src/components/portal/MultiLogoUpload.tsx`

1. Update the `createInitialLogos` function -- change the third entry:
   - `label`: "Icon/Favicon" -> "Additional Logos"
   - `description`: "Square format, 512x512+" -> "For marketing materials & guest interfaces"

2. Update the icon used for the section:
   - Replace the `Sparkles` icon import with `Images` (from lucide-react), which better represents "additional logos"
   - Update the icon reference in the "Additional Logos" section header (line 181)

3. Update the comment on line 173 from `{/* Icon/Favicon - Full width below */}` to `{/* Additional Logos - Full width below */}`

No changes needed to the data model -- the upload type key remains `"icon"` internally to preserve backward compatibility with existing saved data and the `getLogoUrls` helper in `BrandStep.tsx`.

---

**Technical Details**

In `MultiLogoUpload.tsx`:
- Line 4: Replace `Sparkles` with `Images` in the lucide-react import
- Line 26: Change label to `"Additional Logos"` and description to `"For marketing materials & guest interfaces"`
- Line 173: Update comment text
- Line 181: Replace `<Sparkles ...>` with `<Images ...>`

The internal type key `"icon"` is intentionally kept unchanged to maintain compatibility with the storage keys (`logo_{propertyId}_icon`) and existing persisted data.
