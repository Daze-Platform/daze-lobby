import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ActivityLog = Tables<"activity_logs"> & {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

/**
 * Deduplicate rapid-fire identical entries:
 * If the same user triggers the same action with identical details within 5 seconds, keep only the first.
 */
function deduplicateLogs(logs: ActivityLog[]): ActivityLog[] {
  if (!logs.length) return logs;
  const result: ActivityLog[] = [logs[0]];

  for (let i = 1; i < logs.length; i++) {
    const prev = result[result.length - 1];
    const curr = logs[i];

    // Same action, same user, same client
    if (
      curr.action === prev.action &&
      curr.user_id === prev.user_id &&
      curr.client_id === prev.client_id
    ) {
      // Within 5 seconds
      const timeDiff = Math.abs(
        new Date(prev.created_at).getTime() - new Date(curr.created_at).getTime()
      );
      if (timeDiff < 5000) {
        // Same details content — skip duplicate
        if (JSON.stringify(curr.details) === JSON.stringify(prev.details)) {
          continue;
        }
      }
    }
    result.push(curr);
  }
  return result;
}

export function useActivityLogs(clientId: string | null, page = 0, pageSize = 30) {
  return useQuery({
    queryKey: ["activity-logs", clientId, page],
    enabled: !!clientId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(logs?.filter(l => l.user_id).map(l => l.user_id) || [])];
      
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

      const enriched = (logs || []).map(log => ({
        ...log,
        profile: log.user_id ? profilesMap[log.user_id] || null : null,
      })) as ActivityLog[];

      return deduplicateLogs(enriched);
    },
  });
}
