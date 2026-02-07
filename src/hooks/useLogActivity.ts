import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface LogActivityParams {
  action: string;
  details?: Record<string, unknown>;
}

export function useLogActivity(clientId: string | null) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, details }: LogActivityParams) => {
      if (!clientId || !user?.id) return;

      const { error } = await supabase.from("activity_logs").insert([{
        client_id: clientId,
        user_id: user.id,
        action,
        details: (details || null) as Json,
        is_auto_logged: false,
      }]);

      if (error) {
        console.error("Failed to log activity:", error);
        // Don't throw - activity logging should not block main operations
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activity-logs", clientId],
      });
    },
  });
}
