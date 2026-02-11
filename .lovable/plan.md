

## Add Color Palette to Venue Manager

Each venue will get its own color palette, allowing clients to define brand colors per venue location (e.g., different color schemes for "Pool Deck" vs "Lobby Bar").

### Database Change

Add a `color_palette` JSONB column to the `venues` table to store an array of hex color strings per venue.

```text
venues table
+----------------+----------+
| column         | type     |
+----------------+----------+
| ...existing... | ...      |
| color_palette  | jsonb    | (new - default '[]')
+----------------+----------+
```

### Code Changes

1. **Migration** - Add `color_palette jsonb DEFAULT '[]'::jsonb` column to `venues` table.

2. **Types (`src/types/venue.ts`)** - Add `colorPalette: string[]` to the `Venue` interface and `color_palette` to `DbVenue`.

3. **Data layer (`src/hooks/useClientPortal.ts`)** - Map `color_palette` from the database into the `colorPalette` field when fetching venues. Include `colorPalette` in the `updateVenue` mutation payload.

4. **Venue update types (`src/types/venue.ts`)** - Add `colorPalette?: string[]` to `VenueUpdate`.

5. **Venue handlers (`src/hooks/useVenueHandlers.ts`)** - Pass through `colorPalette` updates.

6. **VenueContext (`src/contexts/VenueContext.tsx`)** - No structural changes needed; it already proxies `updateVenue`.

7. **VenueCard (`src/components/portal/VenueCard.tsx`)** - Import and render the existing `ColorPaletteManager` component below the logo upload section. Wire `onChange` to call `onColorPaletteChange` which debounce-saves to the database.

8. **VenueManager (`src/components/portal/VenueManager.tsx`)** - Add `onColorPaletteChange` handler that calls `updateVenue` with the new palette. Pass it down to `VenueCard`. Color palette remains optional for step completion (not gated by validation).

### Technical Details

- Reuses the existing `ColorPaletteManager` component as-is (supports up to 5 colors with picker, hex input, preview strip).
- Color palette changes auto-save via the same debounced `updateVenue` path used for venue names.
- The palette is optional -- venues can complete the step without adding colors.
- Stored as JSONB array (e.g., `["#3B82F6", "#F59E0B"]`) for flexibility.

