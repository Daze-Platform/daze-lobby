import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ActivityLog = Tables<"activity_logs"> & {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function useActivityLogs(hotelId: string | null) {
  return useQuery({
    queryKey: ["activity-logs", hotelId],
    enabled: !!hotelId,
    refetchInterval: 30000, // Refresh every 30 seconds for near-real-time
    queryFn: async () => {
      // First get the activity logs
      const { data: logs, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("hotel_id", hotelId!)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(logs?.filter(l => l.user_id).map(l => l.user_id) || [])];
      
      // Fetch profiles for those users
      let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
        }
      }

      // Combine logs with profiles
      return (logs || []).map(log => ({
        ...log,
        profile: log.user_id ? profilesMap[log.user_id] || null : null,
      })) as ActivityLog[];
    },
  });
}
