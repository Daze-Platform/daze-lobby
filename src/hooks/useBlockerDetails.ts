import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BlockerAlert = Tables<"blocker_alerts">;

export function useBlockerDetails(hotelId: string | null) {
  return useQuery({
    queryKey: ["blocker-details", hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocker_alerts")
        .select("*")
        .eq("hotel_id", hotelId!)
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as BlockerAlert;
    },
  });
}
