import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface OnboardingTask {
  id: string;
  hotel_id: string;
  task_key: string;
  task_name: string;
  is_completed: boolean;
  completed_at: string | null;
  data: Record<string, unknown>;
}

interface ClientHotel {
  id: string;
  user_id: string;
  hotel_id: string;
  hotels: {
    id: string;
    name: string;
    phase: string;
    onboarding_progress: number | null;
  };
}

export function useClientPortal() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Fetch client's hotel
  const { data: clientHotel, isLoading: isLoadingHotel } = useQuery({
    queryKey: ["client-hotel", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("client_hotels")
        .select(`
          id,
          user_id,
          hotel_id,
          hotels (
            id,
            name,
            phase,
            onboarding_progress
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ClientHotel | null;
    },
    enabled: !!user?.id,
  });

  // Fetch onboarding tasks for the hotel
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["onboarding-tasks", clientHotel?.hotel_id],
    queryFn: async () => {
      if (!clientHotel?.hotel_id) return [];
      
      const { data, error } = await supabase
        .from("onboarding_tasks")
        .select("*")
        .eq("hotel_id", clientHotel.hotel_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as OnboardingTask[]) || [];
    },
    enabled: !!clientHotel?.hotel_id,
  });

  // Update task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ 
      taskKey, 
      data 
    }: { 
      taskKey: string; 
      data: Record<string, unknown> 
    }) => {
      if (!clientHotel?.hotel_id) throw new Error("No hotel found");

      const { error } = await supabase
        .from("onboarding_tasks")
        .update({ 
          data: data as unknown as Record<string, unknown>,
          is_completed: true,
          completed_at: new Date().toISOString(),
        } as never)
        .eq("hotel_id", clientHotel.hotel_id)
        .eq("task_key", taskKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["client-hotel"] });
      toast.success("Task updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });

  // Upload file
  const uploadFileMutation = useMutation({
    mutationFn: async ({ 
      taskKey, 
      file, 
      fieldName 
    }: { 
      taskKey: string; 
      file: File; 
      fieldName: string;
    }) => {
      if (!user?.id || !clientHotel?.hotel_id) throw new Error("Not authenticated");

      const filePath = `${user.id}/${clientHotel.hotel_id}/${taskKey}/${fieldName}_${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("client-uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update task with file reference
      const { error: updateError } = await supabase
        .from("onboarding_tasks")
        .update({ 
          data: { [fieldName]: filePath },
          is_completed: taskKey === "legal", // Auto-complete legal on file upload
          completed_at: taskKey === "legal" ? new Date().toISOString() : null,
        } as never)
        .eq("hotel_id", clientHotel.hotel_id)
        .eq("task_key", taskKey);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      toast.success("File uploaded successfully!");
    },
    onError: (error) => {
      toast.error("Failed to upload file: " + error.message);
    },
  });

  // Calculate progress
  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.is_completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Get status based on phase
  const getStatus = (): "onboarding" | "reviewing" | "live" => {
    const phase = clientHotel?.hotels?.phase;
    if (phase === "contracted") return "live";
    if (phase === "pilot_live") return "reviewing";
    return "onboarding";
  };

  return {
    hotel: clientHotel?.hotels,
    tasks: tasks || [],
    isLoading: isLoadingHotel || isLoadingTasks,
    progress: calculateProgress(),
    status: getStatus(),
    updateTask: updateTaskMutation.mutate,
    uploadFile: uploadFileMutation.mutate,
    isUpdating: updateTaskMutation.isPending,
    isUploading: uploadFileMutation.isPending,
  };
}
