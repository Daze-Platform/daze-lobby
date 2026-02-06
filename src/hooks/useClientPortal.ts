import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
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
  const { hotel, hotelId, isLoading: isHotelLoading } = useHotel();
  const queryClient = useQueryClient();

  // Fetch onboarding tasks for the hotel
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["onboarding-tasks", hotelId],
    queryFn: async () => {
      if (!hotelId) return [];
      
      const { data, error } = await supabase
        .from("onboarding_tasks")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as OnboardingTask[]) || [];
    },
    enabled: !!hotelId,
  });

  // Fetch venues for the hotel
  const { data: venuesData, isLoading: isLoadingVenues } = useQuery({
    queryKey: ["venues", hotelId],
    queryFn: async () => {
      if (!hotelId) return [];
      
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as DbVenue[]) || [];
    },
    enabled: !!hotelId,
  });

  // Save legal entity info to hotels table (draft save)
  const saveLegalEntityMutation = useMutation({
    mutationFn: async (data: {
      legal_entity_name?: string;
      billing_address?: string;
      authorized_signer_name?: string;
      authorized_signer_title?: string;
    }) => {
      if (!hotelId) throw new Error("No hotel found");

      const { error } = await supabase
        .from("hotels")
        .update({
          legal_entity_name: data.legal_entity_name || null,
          billing_address: data.billing_address || null,
          authorized_signer_name: data.authorized_signer_name || null,
          authorized_signer_title: data.authorized_signer_title || null,
        })
        .eq("id", hotelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel"] });
      toast.success("Legal entity information saved");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  // Sign legal document - ISOLATED PATH: contracts/{hotel_id}/pilot_agreement.png
  const signLegalMutation = useMutation({
    mutationFn: async ({ 
      signatureDataUrl,
      legalEntityData,
    }: { 
      signatureDataUrl: string;
      legalEntityData?: {
        legal_entity_name?: string;
        billing_address?: string;
        authorized_signer_name?: string;
        authorized_signer_title?: string;
      };
    }) => {
      if (!user?.id || !hotelId) {
        throw new Error("Not authenticated or no hotel assigned");
      }

      // First save legal entity data to hotels table
      if (legalEntityData) {
        const { error: hotelError } = await supabase
          .from("hotels")
          .update({
            legal_entity_name: legalEntityData.legal_entity_name || null,
            billing_address: legalEntityData.billing_address || null,
            authorized_signer_name: legalEntityData.authorized_signer_name || null,
            authorized_signer_title: legalEntityData.authorized_signer_title || null,
          })
          .eq("id", hotelId);

        if (hotelError) throw hotelError;
      }

      // Convert base64 data URL to Blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();

      // MULTI-TENANT PATH: contracts/{hotel_id}/pilot_agreement.png
      const filePath = `${hotelId}/pilot_agreement.png`;

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the URL (private bucket - use signed URL)
      const { data: urlData } = await supabase.storage
        .from("contracts")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      const signatureUrl = urlData?.signedUrl;
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
            signer_name: legalEntityData?.authorized_signer_name,
            signer_title: legalEntityData?.authorized_signer_title,
            legal_entity: legalEntityData?.legal_entity_name,
          },
        } as never)
        .eq("hotel_id", hotelId)
        .eq("task_key", "legal");

      if (updateError) throw updateError;

      return { signatureUrl, signedAt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["hotel"] });
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
      if (!hotelId) throw new Error("No hotel found");

      const { error } = await supabase
        .from("onboarding_tasks")
        .update({ 
          data: data as unknown as Record<string, unknown>,
          is_completed: true,
          completed_at: new Date().toISOString(),
        } as never)
        .eq("hotel_id", hotelId)
        .eq("task_key", taskKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      toast.success("Task updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });

  // Upload logo file - ISOLATED PATH: brands/{hotel_id}/logo_{variant}_{timestamp}.png
  const uploadLogoMutation = useMutation({
    mutationFn: async ({ 
      file, 
      variant 
    }: { 
      file: File; 
      variant: string;
    }) => {
      if (!hotelId) throw new Error("No hotel found");

      const safeName = sanitizeFilename(file.name);
      const timestamp = Date.now();
      // MULTI-TENANT PATH: brands/{hotel_id}/logo_{variant}_{timestamp}_{filename}
      const filePath = `${hotelId}/logo_${variant}_${timestamp}_${safeName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from("onboarding-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(filePath);

      // Update brand task with logo reference
      const existingTask = tasks?.find(t => t.task_key === "brand");
      const existingData = (existingTask?.data || {}) as Record<string, unknown>;
      const existingLogos = (existingData.logos || {}) as Record<string, string>;

      const { error: updateError } = await supabase
        .from("onboarding_tasks")
        .update({ 
          data: { 
            ...existingData, 
            logos: { 
              ...existingLogos, 
              [variant]: urlData?.publicUrl 
            }
          },
        } as never)
        .eq("hotel_id", hotelId)
        .eq("task_key", "brand");

      if (updateError) throw updateError;

      return { path: filePath, url: urlData?.publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      toast.success("Logo uploaded successfully!");
    },
    onError: (error) => {
      toast.error("Failed to upload logo: " + error.message);
    },
  });

  // Upload venue menu - ISOLATED PATH: venues/{hotel_id}/{venue_name}/menu.pdf
  const uploadVenueMenuMutation = useMutation({
    mutationFn: async ({ 
      venueId,
      venueName,
      file 
    }: { 
      venueId: string;
      venueName: string;
      file: File;
    }) => {
      if (!hotelId) throw new Error("No hotel found");

      // Sanitize venue name for path
      const safeVenueName = venueName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      // MULTI-TENANT PATH: venues/{hotel_id}/{venue_name}/menu.pdf
      const filePath = `${hotelId}/${safeVenueName}/menu.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(filePath);

      // Update venue with menu URL
      const { error: updateError } = await supabase
        .from("venues")
        .update({ menu_pdf_url: urlData?.publicUrl })
        .eq("id", venueId);

      if (updateError) throw updateError;

      return { path: filePath, url: urlData?.publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      toast.success("Menu uploaded successfully!");
    },
    onError: (error) => {
      toast.error("Failed to upload menu: " + error.message);
    },
  });

  // Upload file (generic) - maintains hotel isolation
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
      if (!hotelId) throw new Error("No hotel found");

      const safeName = sanitizeFilename(file.name);
      // MULTI-TENANT PATH: {hotel_id}/{task_key}/{fieldName}_{timestamp}_{filename}
      const filePath = `${hotelId}/${taskKey}/${fieldName}_${Date.now()}_${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
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
        .eq("hotel_id", hotelId)
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

  // Save venues - with hotel_id injection
  const saveVenuesMutation = useMutation({
    mutationFn: async (venues: Venue[]) => {
      if (!hotelId) throw new Error("No hotel found");

      // Delete existing venues for this hotel only
      await supabase
        .from("venues")
        .delete()
        .eq("hotel_id", hotelId);

      // Insert new venues with hotel_id injected
      if (venues.length > 0) {
        const venueInserts = venues
          .filter(v => v.name.trim())
          .map(v => ({
            hotel_id: hotelId, // CRITICAL: Inject hotel_id
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
        .eq("hotel_id", hotelId)
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
    const phase = hotel?.phase;
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
    hotel,
    hotelId,
    tasks: tasks || [],
    venues: formatVenues(),
    isLoading: isHotelLoading || isLoadingTasks || isLoadingVenues,
    progress: calculateProgress(),
    status: getStatus(),
    signLegal: signLegalMutation.mutate,
    saveLegalEntity: saveLegalEntityMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    uploadFile: uploadFileMutation.mutate,
    uploadLogo: uploadLogoMutation.mutate,
    uploadVenueMenu: uploadVenueMenuMutation.mutate,
    saveVenues: saveVenuesMutation.mutate,
    isSigningLegal: signLegalMutation.isPending,
    isSavingLegalEntity: saveLegalEntityMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isUploading: uploadFileMutation.isPending || uploadLogoMutation.isPending,
    isSavingVenues: saveVenuesMutation.isPending,
  };
}
