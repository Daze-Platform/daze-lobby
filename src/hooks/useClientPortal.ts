import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Venue } from "@/components/portal/VenueCard";
import { sanitizeFilename } from "@/lib/fileValidation";

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
    brand_palette: string[] | null;
  };
}

interface DbVenue {
  id: string;
  hotel_id: string;
  name: string;
  menu_pdf_url: string | null;
  created_at: string;
  updated_at: string;
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
            onboarding_progress,
            brand_palette
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

  // Fetch venues for the hotel
  const { data: venuesData, isLoading: isLoadingVenues } = useQuery({
    queryKey: ["venues", clientHotel?.hotel_id],
    queryFn: async () => {
      if (!clientHotel?.hotel_id) return [];
      
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("hotel_id", clientHotel.hotel_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as DbVenue[]) || [];
    },
    enabled: !!clientHotel?.hotel_id,
  });

  // Sign legal document (upload signature to contracts bucket)
  const signLegalMutation = useMutation({
    mutationFn: async ({ 
      signatureDataUrl 
    }: { 
      signatureDataUrl: string;
    }) => {
      if (!user?.id || !clientHotel?.hotel_id) {
        throw new Error("Not authenticated or no hotel assigned");
      }

      // Convert base64 data URL to Blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();

      // Create file path: {user_id}/signatures/{hotel_id}/pilot_agreement.png
      const filePath = `${user.id}/signatures/${clientHotel.hotel_id}/pilot_agreement.png`;

      // Upload to contracts bucket (private, PDF-only normally, but signatures are special)
      // We'll upload to client-uploads since contracts is PDF-only
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("client-uploads")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: true, // Allow overwrite if re-signing
        });

      if (uploadError) throw uploadError;

      // Get the public URL (or signed URL for private bucket)
      const { data: urlData } = supabase.storage
        .from("client-uploads")
        .getPublicUrl(filePath);

      const signatureUrl = urlData?.publicUrl;
      const signedAt = new Date().toISOString();

      // Update the legal task with signature data
      const { error: updateError } = await supabase
        .from("onboarding_tasks")
        .update({
          is_completed: true,
          completed_at: signedAt,
          data: {
            pilot_signed: true,
            signature_url: signatureUrl,
            signed_at: signedAt,
            signature_path: filePath,
          },
        } as never)
        .eq("hotel_id", clientHotel.hotel_id)
        .eq("task_key", "legal");

      if (updateError) throw updateError;

      return { signatureUrl, signedAt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["client-hotel"] });
      toast.success("Agreement signed successfully! Next step unlocked.");
    },
    onError: (error) => {
      toast.error("Failed to save signature: " + error.message);
    },
  });

  // Update task (for non-legal tasks)
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

      const safeName = sanitizeFilename(file.name);
      const filePath = `${user.id}/${clientHotel.hotel_id}/${taskKey}/${fieldName}_${Date.now()}_${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("client-uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get existing task data to merge
      const existingTask = tasks?.find(t => t.task_key === taskKey);
      const existingData = (existingTask?.data || {}) as Record<string, unknown>;

      // Update task with file reference
      const { error: updateError } = await supabase
        .from("onboarding_tasks")
        .update({ 
          data: { ...existingData, [fieldName]: filePath },
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

  // Save venues
  const saveVenuesMutation = useMutation({
    mutationFn: async (venues: Venue[]) => {
      if (!clientHotel?.hotel_id) throw new Error("No hotel found");

      // Delete existing venues
      await supabase
        .from("venues")
        .delete()
        .eq("hotel_id", clientHotel.hotel_id);

      // Insert new venues
      if (venues.length > 0) {
        const venueInserts = venues
          .filter(v => v.name.trim())
          .map(v => ({
            hotel_id: clientHotel.hotel_id,
            name: v.name,
            menu_pdf_url: v.menuPdfUrl || null,
          }));

        if (venueInserts.length > 0) {
          const { error } = await supabase
            .from("venues")
            .insert(venueInserts);

          if (error) throw error;
        }
      }

      // Mark venue task as complete
      const { error: taskError } = await supabase
        .from("onboarding_tasks")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          data: { venue_count: venues.filter(v => v.name.trim()).length },
        } as never)
        .eq("hotel_id", clientHotel.hotel_id)
        .eq("task_key", "venue");

      if (taskError) throw taskError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      toast.success("Venues saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save venues: " + error.message);
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

  // Convert DB venues to UI format
  const formatVenues = (): Venue[] => {
    if (!venuesData) return [];
    return venuesData.map(v => ({
      id: v.id,
      name: v.name,
      menuPdfUrl: v.menu_pdf_url || undefined,
    }));
  };

  return {
    hotel: clientHotel?.hotels,
    hotelId: clientHotel?.hotel_id,
    tasks: tasks || [],
    venues: formatVenues(),
    isLoading: isLoadingHotel || isLoadingTasks || isLoadingVenues,
    progress: calculateProgress(),
    status: getStatus(),
    signLegal: signLegalMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    uploadFile: uploadFileMutation.mutate,
    saveVenues: saveVenuesMutation.mutate,
    isSigningLegal: signLegalMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isUploading: uploadFileMutation.isPending,
    isSavingVenues: saveVenuesMutation.isPending,
  };
}
