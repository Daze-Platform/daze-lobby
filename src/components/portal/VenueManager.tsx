import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Label } from "@/components/ui/label";
import { Plus, MapPin } from "lucide-react";
import { VenueCard, type Venue } from "./VenueCard";

interface VenueManagerProps {
  venues: Venue[];
  onVenuesChange: (venues: Venue[]) => void;
  onSave: () => void;
  isSaving?: boolean;
}

// Simple ID generator since we can't use uuid without adding dependency
const generateId = () => Math.random().toString(36).substring(2, 15);

export function VenueManager({ venues, onVenuesChange, onSave, isSaving }: VenueManagerProps) {
  const addVenue = () => {
    const newVenue: Venue = {
      id: generateId(),
      name: "",
    };
    onVenuesChange([...venues, newVenue]);
  };

  const updateVenue = (updatedVenue: Venue) => {
    onVenuesChange(
      venues.map((v) => (v.id === updatedVenue.id ? updatedVenue : v))
    );
  };

  const removeVenue = (id: string) => {
    onVenuesChange(venues.filter((v) => v.id !== id));
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
          {venues.length} venue{venues.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Venue Cards Grid */}
      {venues.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onUpdate={updateVenue}
              onRemove={removeVenue}
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
        onClick={addVenue}
        className="w-full gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Venue
      </Button>

      {/* Save Button */}
      {venues.length > 0 && (
        <SaveButton
          onClick={onSave}
          disabled={!hasValidVenues}
          className="w-full"
          idleText="Save Venue Configuration"
        />
      )}
    </div>
  );
}
