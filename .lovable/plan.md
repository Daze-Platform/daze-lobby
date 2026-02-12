
# Add POS Provider Logos to New Client Modal Dropdown

## What Changes
The "New Client" modal's POS provider dropdown currently shows plain text names only. This update will add the corresponding logo icons next to each provider name, matching the visual treatment already used in the client portal and admin portal management views.

## Implementation

### File: `src/components/modals/NewClientModal.tsx`

1. **Replace the plain string array** `POS_PROVIDERS` with the same object-based structure used in the other interfaces, containing `id`, `name`, and `logo` fields.

2. **Update the Select dropdown** to render each provider with its logo image alongside the name. Each `SelectItem` will show a small logo (20x20px) next to the provider name, with a fallback to a Store icon when no logo is available (for "Other").

3. **Update the selected value display** in the `SelectTrigger` to also show the logo when a provider is selected.

4. **Adjust the mutation logic** to store the provider name (not the id) in the database notes field, maintaining backward compatibility with existing data.

## Technical Details

- The `POS_PROVIDERS` constant will be converted from a `string[]` to an array of `{ id, name, logo }` objects, reusing the exact same logo paths from `AdminBrandPosControls.tsx`
- The `posProvider` state will store the provider `name` string to maintain compatibility with the existing database insert logic
- Each `SelectItem` will use a flex layout with an `img` element (or Store icon fallback) and the provider name
- Logo images will be sized at 20x20px with `object-contain` to handle different aspect ratios
- The `Store` icon from lucide-react will be imported as the fallback for the "Other" option
