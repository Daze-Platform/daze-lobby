import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface SendBlockerNotificationParams {
  clientId: string;
  blockerReason: string;
  message?: string;
}

export function useSendBlockerNotification() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, blockerReason, message }: SendBlockerNotificationParams) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Fetch the sender's profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const senderName = profile?.full_name || user.email || "Daze Team";

      const { error } = await supabase.from("activity_logs").insert([{
        client_id: clientId,
        user_id: user.id,
        action: "blocker_notification",
        details: {
          blocker_reason: blockerReason,
          message: message || blockerReason,
          sent_by: senderName,
        } as Json,
        is_auto_logged: false,
      }]);

      if (error) {
        throw error;
      }

      return { clientId, blockerReason };
    },
    onSuccess: ({ clientId }) => {
      queryClient.invalidateQueries({
        queryKey: ["activity-logs", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["unread-notification-count", clientId],
      });
      toast.success("Notification sent to client");
    },
    onError: (error) => {
      console.error("Failed to send blocker notification:", error);
      toast.error("Failed to send notification");
    },
  });
}
