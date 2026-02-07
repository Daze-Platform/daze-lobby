import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BlockerAlert = Tables<"blocker_alerts">;

export function useBlockerDetails(clientId: string | null) {
  return useQuery({
    queryKey: ["blocker-details", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocker_alerts")
        .select("*")
        .eq("client_id", clientId!)
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as BlockerAlert;
    },
  });
}
