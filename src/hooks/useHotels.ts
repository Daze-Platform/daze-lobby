import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Hotel = Tables<"hotels"> & {
  hasBlocker: boolean;
  primaryContact: Tables<"hotel_contacts"> | null;
  deviceCount: number;
  onlineDeviceCount: number;
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

      // Fetch devices
      const { data: devices, error: devicesError } = await supabase
        .from("devices")
        .select("hotel_id, status");

      if (devicesError) throw devicesError;

      const devicesByHotel = new Map<
        string,
        { total: number; online: number }
      >();
      devices?.forEach((d) => {
        const current = devicesByHotel.get(d.hotel_id) || {
          total: 0,
          online: 0,
        };
        current.total++;
        if (d.status === "online") current.online++;
        devicesByHotel.set(d.hotel_id, current);
      });

      // Check for stale hotels (no activity > 48h)
      const now = new Date();
      const staleThreshold = 48 * 60 * 60 * 1000; // 48 hours in ms

      return (hotels || []).map((hotel) => {
        const lastUpdate = new Date(hotel.updated_at);
        const isStale = now.getTime() - lastUpdate.getTime() > staleThreshold;
        const deviceInfo = devicesByHotel.get(hotel.id) || {
          total: 0,
          online: 0,
        };

        return {
          ...hotel,
          hasBlocker: blockerHotelIds.has(hotel.id) || isStale,
          primaryContact: contactsByHotel.get(hotel.id) || null,
          deviceCount: deviceInfo.total,
          onlineDeviceCount: deviceInfo.online,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels-with-details"] });
      toast.success("Hotel phase updated");
    },
    onError: (error) => {
      toast.error("Failed to update phase: " + error.message);
    },
  });
}
