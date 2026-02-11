import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DeviceWithClient {
  id: string;
  serial_number: string;
  device_type: string;
  client_id: string;
  status: "online" | "offline" | "maintenance";
  install_date: string | null;
  is_daze_owned: boolean;
  last_check_in: string | null;
  created_at: string;
  updated_at: string;
  // Joined client name
  clientName: string | null;
  // UI-only fields (not in DB yet, placeholder)
  venue?: string;
  batteryLevel?: number;
  signalStrength?: number;
  lastHeartbeat?: string;
  model?: string;
  ipAddress?: string;
}

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async (): Promise<DeviceWithClient[]> => {
      const { data, error } = await supabase
        .from("devices")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((d) => ({
        id: d.id,
        serial_number: d.serial_number,
        device_type: d.device_type,
        client_id: d.client_id,
        status: d.status,
        install_date: d.install_date,
        is_daze_owned: d.is_daze_owned,
        last_check_in: d.last_check_in,
        created_at: d.created_at,
        updated_at: d.updated_at,
        clientName: (d.clients as { name: string } | null)?.name ?? null,
        // Simulated telemetry (would come from real-time source)
        venue: undefined,
        batteryLevel: undefined,
        signalStrength: undefined,
        lastHeartbeat: d.last_check_in
          ? formatTimeAgo(new Date(d.last_check_in))
          : null,
        model: undefined,
        ipAddress: undefined,
      }));
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase
        .from("devices")
        .delete()
        .eq("id", deviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success("Device deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete device: " + error.message);
    },
  });
}

export function useClientList() {
  return useQuery({
    queryKey: ["clients-list-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}
