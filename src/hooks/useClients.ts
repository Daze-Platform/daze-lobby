import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Client = Tables<"clients"> & {
  hasBlocker: boolean;
  primaryContact: Tables<"client_contacts"> | null;
  dazeDeviceCount: number;
  // Incomplete items count (pending tasks + active blockers)
  incompleteCount: number;
  // True if a blocker notification was sent for this client
  hasRecentReminder: boolean;
};

export function useClients() {
  return useQuery({
    queryKey: ["clients-with-details"],
    queryFn: async () => {
      // Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch active blockers
      const { data: blockers, error: blockersError } = await supabase
        .from("blocker_alerts")
        .select("client_id")
        .is("resolved_at", null);

      if (blockersError) throw blockersError;

      const blockerClientIds = new Set(blockers?.map((b) => b.client_id) || []);
      
      // Count blockers per client
      const blockersByClient = new Map<string, number>();
      blockers?.forEach((b) => {
        const current = blockersByClient.get(b.client_id) || 0;
        blockersByClient.set(b.client_id, current + 1);
      });

      // Fetch primary contacts
      const { data: contacts, error: contactsError } = await supabase
        .from("client_contacts")
        .select("*")
        .eq("is_primary", true);

      if (contactsError) throw contactsError;

      const contactsByClient = new Map(
        contacts?.map((c) => [c.client_id, c]) || []
      );

      // Fetch only Daze-owned devices
      const { data: devices, error: devicesError } = await supabase
        .from("devices")
        .select("client_id")
        .eq("is_daze_owned", true);

      if (devicesError) throw devicesError;

      // Count Daze devices per client
      const dazeDevicesByClient = new Map<string, number>();
      devices?.forEach((d) => {
        const current = dazeDevicesByClient.get(d.client_id) || 0;
        dazeDevicesByClient.set(d.client_id, current + 1);
      });

      // Fetch blocker notifications to track which clients have been reminded

      // Fetch blocker notifications to track which clients have been reminded
      const { data: notifications, error: notificationsError } = await supabase
        .from("activity_logs")
        .select("client_id")
        .eq("action", "blocker_notification");

      if (notificationsError) throw notificationsError;

      // Track clients that have received at least one reminder
      const clientsWithReminders = new Set(
        notifications?.map((n) => n.client_id) || []
      );

      // Check for stale clients (no activity > 48h)
      const now = new Date();
      const staleThreshold = 48 * 60 * 60 * 1000; // 48 hours in ms

      return (clients || []).map((client) => {
        const lastUpdate = new Date(client.updated_at);
        const isStale = now.getTime() - lastUpdate.getTime() > staleThreshold;
        const blockerCount = blockersByClient.get(client.id) || 0;

        return {
          ...client,
          hasBlocker: blockerClientIds.has(client.id) || isStale,
          primaryContact: contactsByClient.get(client.id) || null,
          dazeDeviceCount: dazeDevicesByClient.get(client.id) || 0,
          incompleteCount: blockerCount,
          hasRecentReminder: clientsWithReminders.has(client.id),
        } as Client;
      });
    },
  });
}

export function useUpdateClientPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      newPhase,
    }: {
      clientId: string;
      newPhase: Enums<"lifecycle_phase">;
    }) => {
      const { error } = await supabase
        .from("clients")
        .update({
          phase: newPhase,
          phase_started_at: new Date().toISOString(),
        })
        .eq("id", clientId);

      if (error) throw error;
    },
    // OPTIMISTIC UPDATE: Instantly update UI before API call completes
    onMutate: async ({ clientId, newPhase }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["clients-with-details"] });

      // Snapshot the previous value for rollback
      const previousClients = queryClient.getQueryData<Client[]>([
        "clients-with-details",
      ]);

      // Optimistically update the cache
      queryClient.setQueryData<Client[]>(["clients-with-details"], (old) => {
        if (!old) return old;
        return old.map((client) =>
          client.id === clientId
            ? {
                ...client,
                phase: newPhase,
                phase_started_at: new Date().toISOString(),
              }
            : client
        );
      });

      // Return context for potential rollback
      return { previousClients };
    },
    // ROLLBACK: If mutation fails, restore previous state
    onError: (error, _variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(
          ["clients-with-details"],
          context.previousClients
        );
      }
      toast.error("Failed to update phase: " + error.message);
    },
    // SETTLE: Sync with server after mutation (success or failure)
    onSettled: () => {
      // Refetch to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: ["clients-with-details"] });
    },
    onSuccess: () => {
      // Silent success - no toast since the UI already updated instantly
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-with-details"] });
      toast.success("Client deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete client: " + error.message);
    },
  });
}

// Note: Client type is now available from @/types
