import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Trash2, Loader2, Store } from "lucide-react";
import { toast } from "sonner";

interface AdminVenuePresetsProps {
  clientId: string;
}

interface Venue {
  id: string;
  name: string;
  client_id: string;
  created_at: string;
}

export function AdminVenuePresets({ clientId }: AdminVenuePresetsProps) {
  const queryClient = useQueryClient();
  const [newVenueName, setNewVenueName] = useState("");

  // Fetch existing venues
  const { data: venues, isLoading } = useQuery({
    queryKey: ["admin-venues", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Venue[];
    },
  });

  // Add venue mutation with optimistic update
  const addVenueMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("venues")
        .insert({
          client_id: clientId,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["admin-venues", clientId] });
      
      const previousVenues = queryClient.getQueryData<Venue[]>(["admin-venues", clientId]);
      
      // Optimistic add
      const optimisticVenue: Venue = {
        id: `temp-${Date.now()}`,
        name: name.trim(),
        client_id: clientId,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Venue[]>(["admin-venues", clientId], (old) => 
        old ? [...old, optimisticVenue] : [optimisticVenue]
      );
      
      return { previousVenues };
    },
    onError: (error: Error, _name, context) => {
      if (context?.previousVenues) {
        queryClient.setQueryData(["admin-venues", clientId], context.previousVenues);
      }
      toast.error(`Failed to add venue: ${error.message}`);
    },
    onSuccess: async (_data, name) => {
      setNewVenueName("");
      toast.success("Venue added");
      // Log venue preset added
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activity_logs").insert([{
          client_id: clientId,
          user_id: user.id,
          action: "venue_preset_added",
          details: { venue_name: name.trim() } as unknown as Json,
          is_auto_logged: false,
        }]);
        queryClient.invalidateQueries({ queryKey: ["activity-logs", clientId] });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-venues", clientId] });
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
    },
  });

  // Delete venue mutation with optimistic update
  const deleteVenueMutation = useMutation({
    mutationFn: async (venueId: string) => {
      const { error } = await supabase
        .from("venues")
        .delete()
        .eq("id", venueId);

      if (error) throw error;
    },
    onMutate: async (venueId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-venues", clientId] });
      
      const previousVenues = queryClient.getQueryData<Venue[]>(["admin-venues", clientId]);
      
      // Optimistic delete
      queryClient.setQueryData<Venue[]>(["admin-venues", clientId], (old) => 
        old ? old.filter(v => v.id !== venueId) : []
      );
      
      return { previousVenues };
    },
    onError: (error: Error, _venueId, context) => {
      if (context?.previousVenues) {
        queryClient.setQueryData(["admin-venues", clientId], context.previousVenues);
      }
      toast.error(`Failed to delete venue: ${error.message}`);
    },
    onSuccess: async (_data, venueId) => {
      toast.success("Venue removed");
      // Log venue preset removed
      const { data: { user } } = await supabase.auth.getUser();
      const removedVenue = venues?.find(v => v.id === venueId);
      if (user) {
        await supabase.from("activity_logs").insert([{
          client_id: clientId,
          user_id: user.id,
          action: "venue_preset_removed",
          details: { venue_name: removedVenue?.name || "Unknown" } as unknown as Json,
          is_auto_logged: false,
        }]);
        queryClient.invalidateQueries({ queryKey: ["activity-logs", clientId] });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-venues", clientId] });
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
    },
  });

  const handleAddVenue = () => {
    if (!newVenueName.trim()) return;
    addVenueMutation.mutate(newVenueName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddVenue();
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Venue Presets
        </CardTitle>
        <CardDescription className="text-xs">
          Pre-add venue names that will appear in the client's Venue Manager
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add venue input */}
        <div className="flex gap-2">
          <Input
            value={newVenueName}
            onChange={(e) => setNewVenueName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Pool Deck, Beachside Bar"
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleAddVenue}
            disabled={!newVenueName.trim() || addVenueMutation.isPending}
          >
            {addVenueMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Venue list */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : venues && venues.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {venues.map((venue) => (
                <motion.div
                  key={venue.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50 group hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{venue.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => deleteVenueMutation.mutate(venue.id)}
                    disabled={deleteVenueMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No venues added yet</p>
              <p className="text-xs mt-1">Add venue names above to pre-populate the client's portal</p>
            </div>
          )}
        </div>

        {venues && venues.length > 0 && (
          <p className="text-2xs text-muted-foreground text-center">
            {venues.length} venue{venues.length !== 1 ? "s" : ""} configured
          </p>
        )}
      </CardContent>
    </Card>
  );
}
