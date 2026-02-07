import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Hotel = Tables<"hotels"> & {
  hasBlocker: boolean;
  primaryContact: Tables<"hotel_contacts"> | null;
  dazeDeviceCount: number;
};

export function useHotels() {
  return useQuery({
    queryKey: ["hotels-with-details"],
    queryFn: async () => {
      // Fetch hotels
      const { data: hotels, error: hotelsError } = await supabase
        .from("hotels")
        .select("*")
        .order("created_at", { ascending: false });

      if (hotelsError) throw hotelsError;

      // Fetch active blockers
      const { data: blockers, error: blockersError } = await supabase
        .from("blocker_alerts")
        .select("hotel_id")
        .is("resolved_at", null);

      if (blockersError) throw blockersError;

      const blockerHotelIds = new Set(blockers?.map((b) => b.hotel_id) || []);

      // Fetch primary contacts
      const { data: contacts, error: contactsError } = await supabase
        .from("hotel_contacts")
        .select("*")
        .eq("is_primary", true);

      if (contactsError) throw contactsError;

      const contactsByHotel = new Map(
        contacts?.map((c) => [c.hotel_id, c]) || []
      );

      // Fetch only Daze-owned devices
      const { data: devices, error: devicesError } = await supabase
        .from("devices")
        .select("hotel_id")
        .eq("is_daze_owned", true);

      if (devicesError) throw devicesError;

      // Count Daze devices per hotel
      const dazeDevicesByHotel = new Map<string, number>();
      devices?.forEach((d) => {
        const current = dazeDevicesByHotel.get(d.hotel_id) || 0;
        dazeDevicesByHotel.set(d.hotel_id, current + 1);
      });

      // Check for stale hotels (no activity > 48h)
      const now = new Date();
      const staleThreshold = 48 * 60 * 60 * 1000; // 48 hours in ms

      return (hotels || []).map((hotel) => {
        const lastUpdate = new Date(hotel.updated_at);
        const isStale = now.getTime() - lastUpdate.getTime() > staleThreshold;

        return {
          ...hotel,
          hasBlocker: blockerHotelIds.has(hotel.id) || isStale,
          primaryContact: contactsByHotel.get(hotel.id) || null,
          dazeDeviceCount: dazeDevicesByHotel.get(hotel.id) || 0,
        } as Hotel;
      });
    },
  });
}

export function useUpdateHotelPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hotelId,
      newPhase,
    }: {
      hotelId: string;
      newPhase: Enums<"lifecycle_phase">;
    }) => {
      const { error } = await supabase
        .from("hotels")
        .update({
          phase: newPhase,
          phase_started_at: new Date().toISOString(),
        })
        .eq("id", hotelId);

      if (error) throw error;
    },
    // OPTIMISTIC UPDATE: Instantly update UI before API call completes
    onMutate: async ({ hotelId, newPhase }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["hotels-with-details"] });

      // Snapshot the previous value for rollback
      const previousHotels = queryClient.getQueryData<Hotel[]>(["hotels-with-details"]);

      // Optimistically update the cache
      queryClient.setQueryData<Hotel[]>(["hotels-with-details"], (old) => {
        if (!old) return old;
        return old.map((hotel) =>
          hotel.id === hotelId
            ? {
                ...hotel,
                phase: newPhase,
                phase_started_at: new Date().toISOString(),
              }
            : hotel
        );
      });

      // Return context for potential rollback
      return { previousHotels };
    },
    // ROLLBACK: If mutation fails, restore previous state
    onError: (error, _variables, context) => {
      if (context?.previousHotels) {
        queryClient.setQueryData(["hotels-with-details"], context.previousHotels);
      }
      toast.error("Failed to update phase: " + error.message);
    },
    // SETTLE: Sync with server after mutation (success or failure)
    onSettled: () => {
      // Refetch to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: ["hotels-with-details"] });
    },
    onSuccess: () => {
      // Silent success - no toast since the UI already updated instantly
    },
  });
}
