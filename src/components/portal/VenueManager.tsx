import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Label } from "@/components/ui/label";
import { Plus, MapPin } from "lucide-react";
import { VenueCard } from "./VenueCard";
import { useVenueContext } from "@/contexts/VenueContext";
import { toast } from "sonner";

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

interface VenueManagerProps {
  onStepComplete?: () => void;
}

export function VenueManager({ onStepComplete }: VenueManagerProps) {
  const {
    venues,
    addVenue,
    updateVenue,
    removeVenue,
    removeMenu,
    removeLogo,
    removeAdditionalLogo,
    uploadMenu,
    uploadLogo,
    uploadAdditionalLogo,
    completeStep,
    isAddingVenue,
    isUpdatingVenue,
    isDeletingVenue,
    uploadingMenuIds,
    uploadingLogoIds,
    uploadingAdditionalLogoIds,
  } = useVenueContext();

  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  
  // Debounced update for venue names
  const debouncedUpdate = useMemo(
    () => debounce(async (id: string, name: string) => {
      setPendingUpdates(prev => new Set(prev).add(id));
      try {
        await updateVenue(id, { name });
      } finally {
        setPendingUpdates(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }, 600),
    [updateVenue]
  );

  // Debounced color palette save
  const debouncedColorPaletteUpdate = useMemo(
    () => debounce(async (id: string, colorPalette: string[]) => {
      await updateVenue(id, { colorPalette });
    }, 600),
    [updateVenue]
  );

  const handleAddVenue = async () => {
    const newVenue = await addVenue();
    if (newVenue) {
      setNewlyAddedId(newVenue.id);
      // Clear the focus indicator after a short delay
      setTimeout(() => setNewlyAddedId(null), 100);
    }
  };

  const handleVenueNameChange = (venueId: string, newName: string) => {
    debouncedUpdate(venueId, newName);
  };

  const handleMenuUpload = async (venueId: string, venueName: string, file: File) => {
    await uploadMenu(venueId, venueName, file);
  };

  const handleLogoUpload = async (venueId: string, venueName: string, file: File) => {
    await uploadLogo(venueId, venueName, file);
  };

  const handleAdditionalLogoUpload = async (venueId: string, venueName: string, file: File) => {
    await uploadAdditionalLogo(venueId, venueName, file);
  };

  const handleCompleteStep = async () => {
    await completeStep();
    onStepComplete?.();
  };

  const hasValidVenues = venues.length > 0 && venues.every(v => v.name.trim() && v.menus.length > 0 && (v.logoUrl || v.logoFile));
  const hasMissingFields = venues.length > 0 && !hasValidVenues;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Venues
        </Label>
        <span className="text-xs text-muted-foreground">
          {venues.length} venue{venues.length !== 1 ? "s" : ""} • Auto-saved
        </span>
      </div>

      {/* Venue Cards Grid */}
      {venues.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {venues.map((venue) => (
              <motion.div
                key={venue.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              >
                <VenueCard
                  venue={venue}
                  onNameChange={(name) => handleVenueNameChange(venue.id, name)}
                  onMenuUpload={(file) => handleMenuUpload(venue.id, venue.name, file)}
                  onLogoUpload={(file) => handleLogoUpload(venue.id, venue.name, file)}
                  onAdditionalLogoUpload={(file) => handleAdditionalLogoUpload(venue.id, venue.name, file)}
                  onMenuRemove={(menuId) => removeMenu(menuId)}
                  onLogoRemove={() => removeLogo(venue.id)}
                  onAdditionalLogoRemove={() => removeAdditionalLogo(venue.id)}
                  onColorPaletteChange={(colors) => debouncedColorPaletteUpdate(venue.id, colors)}
                  onRemove={() => {
                    const venueName = venue.name || "Venue";
                    removeVenue(venue.id);
                    toast.success(`"${venueName}" removed`);
                  }}
                  isSaving={pendingUpdates.has(venue.id)}
                  isDeleting={isDeletingVenue}
                  isUploading={uploadingMenuIds.has(venue.id)}
                  isUploadingLogo={uploadingLogoIds.has(venue.id)}
                  isUploadingAdditionalLogo={uploadingAdditionalLogoIds.has(venue.id)}
                  autoFocus={venue.id === newlyAddedId}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <MapPin className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No venues added yet</p>
          <p className="text-xs text-muted-foreground">
            Add venues like "Pool Deck", "Lobby Bar", or "Room Service"
          </p>
        </div>
      )}

      {/* Add Venue Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddVenue}
        disabled={isAddingVenue}
        className="w-full gap-2 min-h-[44px]"
      >
        <Plus className="w-4 h-4" />
        {isAddingVenue ? "Adding..." : "Add Venue"}
      </Button>

      {venues.length > 0 && (
        <>
          {hasMissingFields && (
            <p className="text-xs text-amber-600 text-center">
              Each venue requires a name, logo, and menu PDF to complete this step.
            </p>
          )}
          <SaveButton
            onClick={handleCompleteStep}
            disabled={!hasValidVenues || isUpdatingVenue}
            className="w-full min-h-[44px]"
            idleText="Complete Step"
            loadingText="Completing..."
            successText="Completed!"
          />
        </>
      )}
    </div>
  );
}
