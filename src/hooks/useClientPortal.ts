import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useClient } from "@/contexts/ClientContext";
import { toast } from "sonner";
import type { Venue } from "@/components/portal/VenueCard";
import { sanitizeFilename } from "@/lib/fileValidation";
import { useLogActivity } from "@/hooks/useLogActivity";
import { dataUrlToBlob } from "@/lib/dataUrlToBlob";

interface OnboardingTask {
  id: string;
  client_id: string;
  task_key: string;
  task_name: string;
  is_completed: boolean;
  completed_at: string | null;
  data: Record<string, unknown>;
}

interface DbVenue {
  id: string;
  client_id: string;
  name: string;
  menu_pdf_url: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientPortal() {
  const { user } = useAuthContext();
  const { client, clientId, isLoading: isClientLoading } = useClient();
  const queryClient = useQueryClient();
  const logActivity = useLogActivity(clientId);

  // Fetch onboarding tasks for the client
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["onboarding-tasks", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("onboarding_tasks")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map((task) => ({
        ...task,
        data: task.data as Record<string, unknown>,
      })) as OnboardingTask[];
    },
    enabled: !!clientId,
  });

  // Fetch venues for the client
  const { data: venuesData, isLoading: isLoadingVenues } = useQuery({
    queryKey: ["venues", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as DbVenue[];
    },
    enabled: !!clientId,
  });

  // Save legal entity info to clients table (draft save)
  const saveLegalEntityMutation = useMutation({
    mutationFn: async (data: {
      legal_entity_name?: string;
      billing_address?: string;
      authorized_signer_name?: string;
      authorized_signer_title?: string;
    }) => {
      if (!clientId) throw new Error("No client found");

      const { error } = await supabase
        .from("clients")
        .update({
          legal_entity_name: data.legal_entity_name || null,
          billing_address: data.billing_address || null,
          authorized_signer_name: data.authorized_signer_name || null,
          authorized_signer_title: data.authorized_signer_title || null,
        })
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client"] });
      toast.success("Legal entity information saved");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  // Sign legal document - ISOLATED PATH: contracts/{client_id}/pilot_agreement.png
  const signLegalMutation = useMutation({
    mutationFn: async ({ 
      signatureDataUrl,
      legalEntityData,
    }: { 
      signatureDataUrl: string;
      legalEntityData?: {
        property_name?: string;
        legal_entity_name?: string;
        billing_address?: string;
        authorized_signer_name?: string;
        authorized_signer_title?: string;
      };
    }) => {
      if (!user?.id || !clientId) {
        throw new Error("Not authenticated or no client assigned");
      }

      // Update client record with legal entity data AND property name
      if (legalEntityData) {
        const updateData: Record<string, unknown> = {
          legal_entity_name: legalEntityData.legal_entity_name || null,
          billing_address: legalEntityData.billing_address || null,
          authorized_signer_name: legalEntityData.authorized_signer_name || null,
          authorized_signer_title: legalEntityData.authorized_signer_title || null,
        };

        // Update the client name if property_name is provided
        if (legalEntityData.property_name) {
          updateData.name = legalEntityData.property_name;
        }

        const { error: clientError } = await supabase
          .from("clients")
          .update(updateData)
          .eq("id", clientId);

        if (clientError) throw clientError;
      }

      // Convert base64 data URL to Blob using robust utility
      // This avoids MIME type issues and potential stack overflow with large files
      const blob = dataUrlToBlob(signatureDataUrl);

      // MULTI-TENANT PATH: contracts/{client_id}/pilot_agreement.png
      const filePath = `${clientId}/pilot_agreement.png`;

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, blob, {
          contentType: "image/png", // Explicitly set content type
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
            property_name: legalEntityData?.property_name,
            signer_name: legalEntityData?.authorized_signer_name,
            signer_title: legalEntityData?.authorized_signer_title,
            legal_entity: legalEntityData?.legal_entity_name,
          },
        } as never)
        .eq("client_id", clientId)
        .eq("task_key", "legal");

      if (updateError) throw updateError;

      return { signatureUrl, signedAt };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
      
      // Log activity
      logActivity.mutate({
        action: "legal_signed",
        details: {
          signer_name: variables.legalEntityData?.authorized_signer_name,
        },
      });
      
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
      if (!clientId) throw new Error("No client found");

      const { error } = await supabase
        .from("onboarding_tasks")
        .update({ 
          data: data as unknown as Record<string, unknown>,
          is_completed: true,
          completed_at: new Date().toISOString(),
        } as never)
        .eq("client_id", clientId)
        .eq("task_key", taskKey);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      
      // Log activity
      logActivity.mutate({
        action: "task_completed",
        details: {
          task_key: variables.taskKey,
        },
      });
      
      toast.success("Task updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });

  // Upload logo file - ISOLATED PATH: brands/{client_id}/logo_{variant}_{timestamp}.png
  const uploadLogoMutation = useMutation({
    mutationFn: async ({ 
      file, 
      variant 
    }: { 
      file: File; 
      variant: string;
    }) => {
      if (!clientId) throw new Error("No client found");

      const safeName = sanitizeFilename(file.name);
      const timestamp = Date.now();
      // MULTI-TENANT PATH: brands/{client_id}/logo_{variant}_{timestamp}_{filename}
      const filePath = `${clientId}/logo_${variant}_${timestamp}_${safeName}`;
      
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
        .eq("client_id", clientId)
        .eq("task_key", "brand");

      if (updateError) throw updateError;

      return { path: filePath, url: urlData?.publicUrl };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      
      // Log activity
      logActivity.mutate({
        action: "logo_uploaded",
        details: {
          variant: variables.variant,
        },
      });
      
      toast.success("Logo uploaded successfully!");
    },
    onError: (error) => {
      toast.error("Failed to upload logo: " + error.message);
    },
  });

  // Upload venue menu - ISOLATED PATH: venues/{client_id}/{venue_name}/menu.pdf
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
      if (!clientId) throw new Error("No client found");

      // Sanitize venue name for path
      const safeVenueName = venueName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      // MULTI-TENANT PATH: venues/{client_id}/{venue_name}/menu.pdf
      const filePath = `${clientId}/${safeVenueName}/menu.pdf`;
      
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      
      // Log activity
      logActivity.mutate({
        action: "menu_uploaded",
        details: {
          venue_name: variables.venueName,
        },
      });
      
      toast.success("Menu uploaded successfully!");
    },
    onError: (error) => {
      toast.error("Failed to upload menu: " + error.message);
    },
  });

  // Upload venue logo - ISOLATED PATH: venues/{client_id}/{venue_name}/logo.{ext}
  const uploadVenueLogoMutation = useMutation({
    mutationFn: async ({ 
      venueId,
      venueName,
      file 
    }: { 
      venueId: string;
      venueName: string;
      file: File;
    }) => {
      if (!clientId) throw new Error("No client found");

      // Sanitize venue name for path
      const safeVenueName = venueName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const fileExt = file.name.split(".").pop() || "png";
      // MULTI-TENANT PATH: venues/{client_id}/{venue_name}/logo.{ext}
      const filePath = `${clientId}/${safeVenueName}/logo_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(filePath);

      // Update venue with logo URL
      const { error: updateError } = await supabase
        .from("venues")
        .update({ logo_url: urlData?.publicUrl })
        .eq("id", venueId);

      if (updateError) throw updateError;

      return { path: filePath, url: urlData?.publicUrl };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      
      // Log activity
      logActivity.mutate({
        action: "venue_logo_uploaded",
        details: {
          venue_name: variables.venueName,
        },
      });
      
      toast.success("Venue logo uploaded!");
    },
    onError: (error) => {
      toast.error("Failed to upload logo: " + error.message);
    },
  });

  // Upload file (generic) - maintains client isolation
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
      if (!clientId) throw new Error("No client found");

      const safeName = sanitizeFilename(file.name);
      // MULTI-TENANT PATH: {client_id}/{task_key}/{fieldName}_{timestamp}_{filename}
      const filePath = `${clientId}/${taskKey}/${fieldName}_${Date.now()}_${safeName}`;
      
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
        .eq("client_id", clientId)
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

  // Add single venue to database
  const addVenueMutation = useMutation({
    mutationFn: async (venue: { name: string }) => {
      if (!clientId) throw new Error("No client found");
      
      const { data, error } = await supabase
        .from("venues")
        .insert({ client_id: clientId, name: venue.name || "New Venue" })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
      
      logActivity.mutate({
        action: "venue_created",
        details: { venue_name: data.name },
      });
    },
    onError: (error) => {
      toast.error("Failed to add venue: " + error.message);
    },
  });

  // Update single venue (name, menu_pdf_url, or logo_url)
  const updateVenueMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; menuPdfUrl?: string; logoUrl?: string } }) => {
      if (!clientId) throw new Error("No client found");
      
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.menuPdfUrl !== undefined) updateData.menu_pdf_url = updates.menuPdfUrl;
      if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
      
      const { error } = await supabase
        .from("venues")
        .update(updateData)
        .eq("id", id)
        .eq("client_id", clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
    },
    onError: (error) => {
      toast.error("Failed to update venue: " + error.message);
    },
  });

  // Delete single venue
  const deleteVenueMutation = useMutation({
    mutationFn: async (venueId: string) => {
      if (!clientId) throw new Error("No client found");
      
      const { error } = await supabase
        .from("venues")
        .delete()
        .eq("id", venueId)
        .eq("client_id", clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
      
      logActivity.mutate({
        action: "venue_deleted",
        details: {},
      });
      
      toast.success("Venue removed");
    },
    onError: (error) => {
      toast.error("Failed to remove venue: " + error.message);
    },
  });

  // Complete venue step (marks task as done without re-saving venues)
  const completeVenueStepMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("No client found");
      
      // Get current venue count
      const { data: venueCount } = await supabase
        .from("venues")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId);
      
      const { error } = await supabase
        .from("onboarding_tasks")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          data: { venue_count: venueCount || 0 },
        } as never)
        .eq("client_id", clientId)
        .eq("task_key", "venue");
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      
      logActivity.mutate({
        action: "venue_step_completed",
        details: {},
      });
      
      toast.success("Venue step completed!");
    },
    onError: (error) => {
      toast.error("Failed to complete step: " + error.message);
    },
  });

  // Mutation to update client phase to "reviewing" (awaiting admin approval)
  const updateClientPhaseMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("No client found");

      const { error } = await supabase
        .from("clients")
        .update({
          phase: "reviewing" as const,
          phase_started_at: new Date().toISOString(),
        })
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client"] });
      queryClient.invalidateQueries({ queryKey: ["clients-with-details"] });
      
      // Log activity
      logActivity.mutate({
        action: "status_changed",
        details: {
          new_phase: "reviewing",
          trigger: "onboarding_complete",
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  // DEBOUNCE GUARD: Track if transition is in progress to prevent multiple calls
  const transitionInProgressRef = useRef(false);

  // Calculate progress - MEMOIZED for performance
  const progress = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.is_completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  // Get status based on phase - MEMOIZED for performance
  const status = useMemo((): "onboarding" | "reviewing" | "live" => {
    const phase = client?.phase;
    if (phase === "contracted") return "live";
    if (phase === "pilot_live") return "live";
    if (phase === "reviewing") return "reviewing";
    return "onboarding";
  }, [client?.phase]);

  // SINGLE REACTIVE PATH: Auto-transition when all tasks complete
  // This effect replaces the competing listener in Portal.tsx
  useEffect(() => {
    // Guard: Only run if we have tasks and client data
    if (!tasks || tasks.length === 0 || !client) return;
    
    // Guard: Already transitioned or transitioning
    if (transitionInProgressRef.current) return;
    if (client.phase !== "onboarding") return;
    
    // Check if all tasks are complete
    const allCompleted = tasks.every(t => t.is_completed);
    
    if (allCompleted) {
      transitionInProgressRef.current = true;
      updateClientPhaseMutation.mutate(undefined, {
        onSettled: () => {
          // Reset guard after mutation completes (success or failure)
          transitionInProgressRef.current = false;
        },
      });
    }
  }, [tasks, client, updateClientPhaseMutation]);

  // Transform venues to component format - MEMOIZED
  const venues: Venue[] = useMemo(() => 
    (venuesData || []).map(v => ({
      id: v.id,
      name: v.name,
      menuPdfUrl: v.menu_pdf_url || undefined,
      logoUrl: v.logo_url || undefined,
    })),
    [venuesData]
  );

  return {
    hotel: client, // Backwards compat alias
    hotelId: clientId, // Backwards compat alias
    client,
    clientId,
    tasks: tasks || [],
    venues,
    isLoading: isClientLoading || isLoadingTasks || isLoadingVenues,
    progress, // Now memoized, derived directly
    status,   // Now memoized, derived directly
    // Mutations
    saveLegalEntity: saveLegalEntityMutation.mutate,
    signLegal: signLegalMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    uploadLogo: uploadLogoMutation.mutate,
    uploadVenueMenu: uploadVenueMenuMutation.mutate,
    uploadVenueLogo: uploadVenueLogoMutation.mutate,
    uploadFile: uploadFileMutation.mutate,
    // Individual venue CRUD
    addVenue: addVenueMutation.mutateAsync,
    updateVenue: updateVenueMutation.mutateAsync,
    deleteVenue: deleteVenueMutation.mutateAsync,
    completeVenueStep: completeVenueStepMutation.mutateAsync,
    // States
    isSavingLegalEntity: saveLegalEntityMutation.isPending,
    isSigningLegal: signLegalMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isAddingVenue: addVenueMutation.isPending,
    isUpdatingVenue: updateVenueMutation.isPending,
    isDeletingVenue: deleteVenueMutation.isPending,
    isTransitioningToLive: updateClientPhaseMutation.isPending,
  };
}
