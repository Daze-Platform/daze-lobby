import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Label } from "@/components/ui/label";
import { Plus, MapPin } from "lucide-react";
import { VenueCard, type Venue } from "./VenueCard";

interface VenueManagerProps {
  venues: Venue[];
  onAddVenue: () => Promise<Venue | undefined>;
  onUpdateVenue: (id: string, updates: { name?: string; menuPdfUrl?: string }) => Promise<void>;
  onRemoveVenue: (id: string) => Promise<void>;
  onUploadMenu: (venueId: string, venueName: string, file: File) => Promise<void>;
  onCompleteStep: () => Promise<void>;
  isAdding?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

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

export function VenueManager({ 
  venues, 
  onAddVenue, 
  onUpdateVenue, 
  onRemoveVenue,
  onUploadMenu,
  onCompleteStep,
  isAdding,
  isUpdating,
  isDeleting,
}: VenueManagerProps) {
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  
  // Debounced update for venue names
  const debouncedUpdate = useMemo(
    () => debounce(async (id: string, name: string) => {
      setPendingUpdates(prev => new Set(prev).add(id));
      try {
        await onUpdateVenue(id, { name });
      } finally {
        setPendingUpdates(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }, 600),
    [onUpdateVenue]
  );

  const handleAddVenue = async () => {
    const newVenue = await onAddVenue();
    if (newVenue) {
      setNewlyAddedId(newVenue.id);
      // Clear the focus indicator after a short delay
      setTimeout(() => setNewlyAddedId(null), 100);
    }
  };

  const handleVenueNameChange = (venue: Venue, newName: string) => {
    // Optimistically update locally, then debounce save
    debouncedUpdate(venue.id, newName);
  };

  const handleMenuUpload = async (venue: Venue, file: File) => {
    await onUploadMenu(venue.id, venue.name, file);
  };

  const hasValidVenues = venues.length > 0 && venues.some(v => v.name.trim());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Venue Locations
        </Label>
        <span className="text-xs text-muted-foreground">
          {venues.length} venue{venues.length !== 1 ? "s" : ""} • Auto-saved
        </span>
      </div>

      {/* Venue Cards Grid */}
      {venues.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onNameChange={(name) => handleVenueNameChange(venue, name)}
              onMenuUpload={(file) => handleMenuUpload(venue, file)}
              onRemove={() => onRemoveVenue(venue.id)}
              isSaving={pendingUpdates.has(venue.id)}
              isDeleting={isDeleting}
              autoFocus={venue.id === newlyAddedId}
            />
          ))}
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
        disabled={isAdding}
        className="w-full gap-2 min-h-[44px]"
      >
        <Plus className="w-4 h-4" />
        {isAdding ? "Adding..." : "Add Venue"}
      </Button>

      {venues.length > 0 && (
        <SaveButton
          onClick={onCompleteStep}
          disabled={!hasValidVenues || isUpdating}
          className="w-full min-h-[44px]"
          idleText="Complete Step"
          loadingText="Completing..."
          successText="Completed!"
        />
      )}
    </div>
  );
}
