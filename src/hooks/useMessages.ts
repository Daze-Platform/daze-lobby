import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface Message {
  id: string;
  client_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  sender_name?: string;
  sender_avatar?: string;
}

export function useMessages(clientId: string | null) {
  return useQuery({
    queryKey: ["messages", clientId],
    enabled: !!clientId,
    refetchInterval: 10000, // Refresh every 10 seconds for near-real-time
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles:sender_id (
            full_name,
            avatar_url
          )
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((msg) => {
        const profile = msg.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
        return {
          ...msg,
          sender_name: profile?.full_name || "Unknown",
          sender_avatar: profile?.avatar_url || null,
        };
      }) as Message[];
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      clientId,
      content,
    }: {
      clientId: string;
      content: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          client_id: clientId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.clientId] });
      // Log message sent
      if (user?.id) {
        await supabase.from("activity_logs").insert([{
          client_id: variables.clientId,
          user_id: user.id,
          action: "message_sent",
          details: { preview: variables.content.substring(0, 50) } as unknown as Json,
          is_auto_logged: false,
        }]);
        queryClient.invalidateQueries({ queryKey: ["activity-logs", variables.clientId] });
      }
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("client_id", clientId)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", clientId] });
    },
  });
}
