import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClearBlockerParams {
  blockerId: string;
  hotelId: string;
  hotelName: string;
}

export function useClearBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blockerId, hotelId, hotelName }: ClearBlockerParams) => {
      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const userName = profile?.full_name || user.email || "Unknown User";

      // Update blocker_alerts - mark as resolved
      const { error: blockerError } = await supabase
        .from("blocker_alerts")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by_id: user.id,
        })
        .eq("id", blockerId);

      if (blockerError) throw blockerError;

      // Log to activity_logs for audit trail
      const { error: activityError } = await supabase
        .from("activity_logs")
        .insert({
          hotel_id: hotelId,
          user_id: user.id,
          action: "blocker_force_cleared",
          details: {
            blocker_id: blockerId,
            cleared_by: userName,
            message: `Blocker manually cleared by ${userName}`,
          },
          is_auto_logged: false,
        });

      if (activityError) throw activityError;

      return { blockerId, hotelId, hotelName, userName };
    },
    onSuccess: ({ hotelName, userName }) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      queryClient.invalidateQueries({ queryKey: ["blocker-details"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });

      toast.success(`Blocker cleared for ${hotelName}`, {
        description: `Manually resolved by ${userName}`,
      });
    },
    onError: (error) => {
      console.error("Failed to clear blocker:", error);
      toast.error("Failed to clear blocker", {
        description: "Please try again or contact support.",
      });
    },
  });
}
