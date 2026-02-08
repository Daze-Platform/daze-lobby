import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

const LAST_VIEWED_KEY_PREFIX = "daze-last-activity-view-";

function getLastViewedTimestamp(clientId: string): string | null {
  try {
    return localStorage.getItem(`${LAST_VIEWED_KEY_PREFIX}${clientId}`);
  } catch {
    return null;
  }
}

function setLastViewedTimestamp(clientId: string): void {
  try {
    localStorage.setItem(`${LAST_VIEWED_KEY_PREFIX}${clientId}`, new Date().toISOString());
  } catch {
    // localStorage unavailable
  }
}

export function useUnreadNotificationCount(clientId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-notification-count", clientId],
    queryFn: async () => {
      if (!clientId) return 0;

      const lastViewed = getLastViewedTimestamp(clientId);
      
      // Query activity logs for blocker_notification actions after last viewed
      let queryBuilder = supabase
        .from("activity_logs")
        .select("id, created_at", { count: "exact", head: true })
        .eq("client_id", clientId)
        .eq("action", "blocker_notification");

      if (lastViewed) {
        queryBuilder = queryBuilder.gt("created_at", lastViewed);
      }

      const { count, error } = await queryBuilder;

      if (error) {
        console.error("Failed to fetch unread notification count:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!clientId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const markAsRead = useCallback(() => {
    if (clientId) {
      setLastViewedTimestamp(clientId);
      queryClient.setQueryData(["unread-notification-count", clientId], 0);
    }
  }, [clientId, queryClient]);

  return {
    ...query,
    unreadCount: query.data || 0,
    markAsRead,
  };
}
