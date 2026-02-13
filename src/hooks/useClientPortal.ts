import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useClient } from "@/contexts/ClientContext";
import { toast } from "sonner";
import type { Venue, DbVenue, DbVenueMenu, VenueMenu } from "@/types/venue";
import { sanitizeFilename } from "@/lib/fileValidation";
import { useLogActivity } from "@/hooks/useLogActivity";
import { dataUrlToBlob } from "@/lib/dataUrlToBlob";
import { generateAgreementPdfBlob } from "@/lib/generateAgreementPdf";
import type { PilotAgreementData } from "@/types/pilotAgreement";

interface OnboardingTask {
  id: string;
  client_id: string;
  task_key: string;
  task_name: string;
  is_completed: boolean;
  completed_at: string | null;
  data: Record<string, unknown>;
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

  // Subscribe to realtime venue changes
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`venues-realtime-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "venues", filter: `client_id=eq.${clientId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clientId, queryClient]);

  // Fetch venue menus for all venues
  const venueIds = useMemo(() => (venuesData || []).map(v => v.id), [venuesData]);
  const { data: venueMenusData } = useQuery({
    queryKey: ["venue-menus", clientId],
    queryFn: async () => {
      if (!clientId || venueIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("venue_menus")
        .select("*")
        .in("venue_id", venueIds)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as DbVenueMenu[];
    },
    enabled: !!clientId && venueIds.length > 0,
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
      legalEntityData?: Record<string, unknown> & {
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

      // Step 1: Update client record with legal entity data AND property name
      if (legalEntityData) {
        const updateData: Record<string, unknown> = {
          legal_entity_name: legalEntityData.legal_entity_name || null,
          billing_address: legalEntityData.billing_address || null,
          authorized_signer_name: legalEntityData.authorized_signer_name || null,
          authorized_signer_title: legalEntityData.authorized_signer_title || null,
        };

        if (legalEntityData.property_name) {
          updateData.name = legalEntityData.property_name;
        }

        const { error: clientError } = await supabase
          .from("clients")
          .update(updateData)
          .eq("id", clientId);

        if (clientError) throw clientError;
      }

      // Step 2: Convert base64 data URL to Blob and upload signature
      const blob = dataUrlToBlob(signatureDataUrl);
      const filePath = `${clientId}/pilot_agreement.png`;

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Step 3: Get signed URL for signature
      const { data: urlData } = await supabase.storage
        .from("contracts")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      const signatureUrl = urlData?.signedUrl;
      const signedAt = new Date().toISOString();

      // Step 4: Update the legal task with signature data + all agreement fields
      const taskData: Record<string, unknown> = {
        pilot_signed: true,
        signature_url: signatureUrl,
        signed_at: signedAt,
        signature_path: filePath,
        property_name: legalEntityData?.property_name,
        signer_name: legalEntityData?.authorized_signer_name,
        signer_title: legalEntityData?.authorized_signer_title,
        legal_entity: legalEntityData?.legal_entity_name,
        contact_email: legalEntityData?.contact_email,
        covered_outlets: legalEntityData?.covered_outlets,
        hardware_option: legalEntityData?.hardware_option,
        start_date: legalEntityData?.start_date,
        pilot_term_days: legalEntityData?.pilot_term_days,
        pricing_model: legalEntityData?.pricing_model,
        pricing_amount: legalEntityData?.pricing_amount,
        pos_system: legalEntityData?.pos_system,
        pos_version: legalEntityData?.pos_version,
        pos_api_key: legalEntityData?.pos_api_key,
        pos_contact: legalEntityData?.pos_contact,
        dba_name: legalEntityData?.dba_name,
        billing_address: legalEntityData?.billing_address,
      };

      const { error: updateError } = await supabase
        .from("onboarding_tasks")
        .update({
          is_completed: true,
          completed_at: signedAt,
          data: taskData,
        } as never)
        .eq("client_id", clientId)
        .eq("task_key", "legal");

      if (updateError) throw updateError;

      // Steps 5-7: PDF generation + upload + document insert — fire-and-forget background
      const bgUserId = user.id;
      const bgClientId = clientId;
      const bgLegalEntityData = legalEntityData;
      const bgSignatureDataUrl = signatureDataUrl;
      const bgSignedAt = signedAt;

      Promise.resolve().then(async () => {
        try {
          const pdfEntity: PilotAgreementData = {
            property_name: bgLegalEntityData?.property_name,
            legal_entity_name: bgLegalEntityData?.legal_entity_name,
            dba_name: bgLegalEntityData?.dba_name as string | undefined,
            billing_address: bgLegalEntityData?.billing_address,
            authorized_signer_name: bgLegalEntityData?.authorized_signer_name,
            authorized_signer_title: bgLegalEntityData?.authorized_signer_title,
            contact_email: bgLegalEntityData?.contact_email as string | undefined,
            covered_outlets: bgLegalEntityData?.covered_outlets as string[] | undefined,
            hardware_option: bgLegalEntityData?.hardware_option as PilotAgreementData["hardware_option"],
            start_date: bgLegalEntityData?.start_date as string | undefined,
            pilot_term_days: bgLegalEntityData?.pilot_term_days as number | undefined,
            pricing_model: bgLegalEntityData?.pricing_model as PilotAgreementData["pricing_model"],
            pricing_amount: bgLegalEntityData?.pricing_amount as string | undefined,
            pos_system: bgLegalEntityData?.pos_system as string | undefined,
            pos_version: bgLegalEntityData?.pos_version as string | undefined,
            pos_api_key: bgLegalEntityData?.pos_api_key as string | undefined,
            pos_contact: bgLegalEntityData?.pos_contact as string | undefined,
          };

          const pdfBlob = await generateAgreementPdfBlob({
            entity: pdfEntity,
            signatureDataUrl: bgSignatureDataUrl,
            signedAt: bgSignedAt,
          });

          const pdfFileName = `pilot-agreement-signed.pdf`;
          const pdfPath = `${bgClientId}/${pdfFileName}`;

          const { error: pdfUploadError } = await supabase.storage
            .from("hotel-documents")
            .upload(pdfPath, pdfBlob, {
              contentType: "application/pdf",
              upsert: true,
            });

          if (!pdfUploadError) {
            await supabase.from("documents").insert({
              client_id: bgClientId,
              display_name: "Pilot Agreement (Signed)",
              file_name: pdfFileName,
              file_path: pdfPath,
              file_size: pdfBlob.size,
              category: "Contract",
              mime_type: "application/pdf",
              uploaded_by_id: bgUserId,
            });
            // Refresh documents list once PDF is ready
            queryClient.invalidateQueries({ queryKey: ["documents", bgClientId] });
          }
        } catch (pdfError) {
          console.warn("Background PDF generation/upload failed:", pdfError);
        }
      });

      return { signatureUrl, signedAt, taskData };
    },
    onMutate: async () => {
      // Optimistic update: immediately mark legal task as signed in cache
      await queryClient.cancelQueries({ queryKey: ["onboarding-tasks", clientId] });
      const previousTasks = queryClient.getQueryData<OnboardingTask[]>(["onboarding-tasks", clientId]);

      if (previousTasks) {
        const optimisticTasks = previousTasks.map(task =>
          task.task_key === "legal"
            ? {
                ...task,
                is_completed: true,
                completed_at: new Date().toISOString(),
                data: {
                  ...task.data,
                  pilot_signed: true,
                  signed_at: new Date().toISOString(),
                },
              }
            : task
        );
        queryClient.setQueryData(["onboarding-tasks", clientId], optimisticTasks);
      }

      return { previousTasks };
    },
    onSuccess: (result, variables) => {
      // Pre-seed cache with known data to avoid refetch latency
      const currentTasks = queryClient.getQueryData<OnboardingTask[]>(["onboarding-tasks", clientId]);
      if (currentTasks && result) {
        const seededTasks = currentTasks.map(task =>
          task.task_key === "legal"
            ? {
                ...task,
                is_completed: true,
                completed_at: result.signedAt,
                data: result.taskData as Record<string, unknown>,
              }
            : task
        );
        queryClient.setQueryData(["onboarding-tasks", clientId], seededTasks);
      }

      // Pre-seed client cache with legal entity fields
      if (variables.legalEntityData) {
        const currentClient = queryClient.getQueryData<Record<string, unknown>>(["client"]);
        if (currentClient) {
          queryClient.setQueryData(["client"], {
            ...currentClient,
            legal_entity_name: variables.legalEntityData.legal_entity_name || null,
            billing_address: variables.legalEntityData.billing_address || null,
            authorized_signer_name: variables.legalEntityData.authorized_signer_name || null,
            authorized_signer_title: variables.legalEntityData.authorized_signer_title || null,
            ...(variables.legalEntityData.property_name ? { name: variables.legalEntityData.property_name } : {}),
          });
        }
      }

      // Background refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
      
      logActivity.mutate({
        action: "legal_signed",
        details: {
          signer_name: variables.legalEntityData?.authorized_signer_name,
        },
      });
      
      toast.success("Agreement signed successfully! Next step unlocked.");
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["onboarding-tasks", clientId], context.previousTasks);
      }
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

      // Atomic merge at DB level — prevents race conditions with concurrent uploads
      const { error } = await supabase.rpc("merge_task_data", {
        p_client_id: clientId,
        p_task_key: taskKey,
        p_merge_data: data as unknown as import("@/integrations/supabase/types").Json,
        p_remove_keys: [],
        p_mark_completed: true,
      });

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

      // Read existing logos sub-object (shallow merge needed for nested object)
      // Safe: uploadLogoMutation is the only writer of the logos/logoFilenames keys
      const { data: freshTask } = await supabase
        .from("onboarding_tasks")
        .select("data")
        .eq("client_id", clientId)
        .eq("task_key", "brand")
        .maybeSingle();
      const existingData = (freshTask?.data as Record<string, unknown>) || {};
      const existingLogos = (existingData.logos || {}) as Record<string, string>;
      const existingLogoFilenames = (existingData.logoFilenames || {}) as Record<string, string>;

      // Atomic merge at DB level
      const { error: updateError } = await supabase.rpc("merge_task_data", {
        p_client_id: clientId,
        p_task_key: "brand",
        p_merge_data: {
          logos: { ...existingLogos, [variant]: urlData?.publicUrl },
          logoFilenames: { ...existingLogoFilenames, [variant]: file.name },
        } as unknown as import("@/integrations/supabase/types").Json,
        p_remove_keys: [],
        p_mark_completed: false,
      });

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

  // Upload venue menu - inserts into venue_menus table
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
      const timestamp = Date.now();
      const safeName = sanitizeFilename(file.name);
      const filePath = `${clientId}/${safeVenueName}/menu_${timestamp}_${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(filePath);

      // Insert into venue_menus table
      const { data: menuRow, error: insertError } = await supabase
        .from("venue_menus")
        .insert({
          venue_id: venueId,
          file_url: urlData?.publicUrl || '',
          file_name: file.name,
          label: '',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { menuId: menuRow.id, url: urlData?.publicUrl, venueId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["venue-menus", clientId] });
      
      logActivity.mutate({
        action: "menu_uploaded",
        details: { venue_name: variables.venueName },
      });
      
      toast.success("Menu uploaded successfully!");
    },
    onError: (error) => {
      toast.error("Failed to upload menu: " + error.message);
    },
  });

  // Delete a venue menu
  const deleteVenueMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      const { error } = await supabase
        .from("venue_menus")
        .delete()
        .eq("id", menuId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-menus", clientId] });
      toast.success("Menu removed");
    },
    onError: (error) => {
      toast.error("Failed to remove menu: " + error.message);
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

      return { path: filePath, url: urlData?.publicUrl, venueId };
    },
    onMutate: async ({ venueId }) => {
      await queryClient.cancelQueries({ queryKey: ["venues", clientId] });
      const previous = queryClient.getQueryData<DbVenue[]>(["venues", clientId]);
      return { previous };
    },
    onSuccess: (data, variables) => {
      // Optimistically patch the venue in cache immediately
      queryClient.setQueryData<DbVenue[]>(["venues", clientId], (old) =>
        old?.map(v => v.id === data.venueId ? { ...v, logo_url: data.url ?? null } : v) ?? []
      );
      
      logActivity.mutate({
        action: "venue_logo_uploaded",
        details: { venue_name: variables.venueName },
      });
      
      toast.success("Venue logo uploaded!");
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["venues", clientId], context.previous);
      }
      toast.error("Failed to upload logo: " + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
    },
  });

  // Upload additional venue logo
  const uploadVenueAdditionalLogoMutation = useMutation({
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

      const safeVenueName = venueName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `${clientId}/${safeVenueName}/additional_logo_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("venues")
        .update({ additional_logo_url: urlData?.publicUrl })
        .eq("id", venueId);

      if (updateError) throw updateError;

      return { path: filePath, url: urlData?.publicUrl, venueId };
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["venues", clientId] });
      const previous = queryClient.getQueryData<DbVenue[]>(["venues", clientId]);
      return { previous };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<DbVenue[]>(["venues", clientId], (old) =>
        old?.map(v => v.id === data.venueId ? { ...v, additional_logo_url: data.url ?? null } : v) ?? []
      );
      
      logActivity.mutate({
        action: "venue_additional_logo_uploaded",
        details: { venue_name: variables.venueName },
      });
      
      toast.success("Additional logo uploaded!");
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["venues", clientId], context.previous);
      }
      toast.error("Failed to upload logo: " + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
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

      // Atomic merge at DB level — prevents race conditions with concurrent form saves
      const { error: updateError } = await supabase.rpc("merge_task_data", {
        p_client_id: clientId,
        p_task_key: taskKey,
        p_merge_data: { [fieldName]: filePath, [`${fieldName}_filename`]: file.name } as unknown as import("@/integrations/supabase/types").Json,
        p_remove_keys: [],
        p_mark_completed: false,
      });

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
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; menuPdfUrl?: string | null; logoUrl?: string | null; additionalLogoUrl?: string | null; colorPalette?: string[] } }) => {
      if (!clientId) throw new Error("No client found");
      
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.menuPdfUrl !== undefined) updateData.menu_pdf_url = updates.menuPdfUrl;
      if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
      if (updates.additionalLogoUrl !== undefined) updateData.additional_logo_url = updates.additionalLogoUrl;
      if (updates.colorPalette !== undefined) updateData.color_palette = updates.colorPalette;
      
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

  // Remove specific keys from task data atomically (for logo/document removal)
  const removeTaskKeysMutation = useMutation({
    mutationFn: async ({
      taskKey,
      mergeData,
      removeKeys,
    }: {
      taskKey: string;
      mergeData: Record<string, unknown>;
      removeKeys: string[];
    }) => {
      if (!clientId) throw new Error("No client found");

      const { error } = await supabase.rpc("merge_task_data", {
        p_client_id: clientId,
        p_task_key: taskKey,
        p_merge_data: mergeData as unknown as import("@/integrations/supabase/types").Json,
        p_remove_keys: removeKeys,
        p_mark_completed: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
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

  // Group venue menus by venue ID
  const menusMap = useMemo(() => {
    const map = new Map<string, VenueMenu[]>();
    (venueMenusData || []).forEach(m => {
      const list = map.get(m.venue_id) || [];
      list.push({ id: m.id, venueId: m.venue_id, fileUrl: m.file_url, fileName: m.file_name, label: m.label });
      map.set(m.venue_id, list);
    });
    return map;
  }, [venueMenusData]);

  // Transform venues to component format - MEMOIZED
  const venues: Venue[] = useMemo(() => 
    (venuesData || []).map(v => ({
      id: v.id,
      name: v.name,
      menuPdfUrl: v.menu_pdf_url || undefined,
      logoUrl: v.logo_url || undefined,
      additionalLogoUrl: v.additional_logo_url || undefined,
      menus: menusMap.get(v.id) || [],
      colorPalette: (v.color_palette as string[] | null) || [],
    })),
    [venuesData, menusMap]
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
    uploadVenueAdditionalLogo: uploadVenueAdditionalLogoMutation.mutate,
    uploadFile: uploadFileMutation.mutate,
    removeTaskKeys: removeTaskKeysMutation.mutateAsync,
    deleteVenueMenu: deleteVenueMenuMutation.mutateAsync,
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
