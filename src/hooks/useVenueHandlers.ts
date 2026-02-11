import { useCallback } from "react";
import type { Venue } from "@/types";
import type { useClientPortal } from "./useClientPortal";

type PortalHook = ReturnType<typeof useClientPortal>;

/**
 * Extracts venue CRUD handlers from Portal pages
 * Reduces duplication between Portal.tsx and PortalAdmin.tsx
 */
export function useVenueHandlers(portal: PortalHook) {
  const {
    addVenue,
    updateVenue,
    deleteVenue,
    uploadVenueMenu,
    uploadVenueLogo,
    completeVenueStep,
  } = portal;

  const handleAddVenue = useCallback(async (): Promise<Venue | undefined> => {
    const result = await addVenue({ name: "" });
    if (result) {
      return {
        id: result.id,
        name: result.name,
        menuPdfUrl: (result as { menu_pdf_url?: string | null }).menu_pdf_url || undefined,
        logoUrl: (result as { logo_url?: string | null }).logo_url || undefined,
        menus: [],
      };
    }
    return undefined;
  }, [addVenue]);

  const handleUpdateVenue = useCallback(async (
    id: string, 
    updates: { name?: string; menuPdfUrl?: string | null; logoUrl?: string | null }
  ) => {
    await updateVenue({ id, updates });
  }, [updateVenue]);

  const handleRemoveVenue = useCallback(async (id: string) => {
    await deleteVenue(id);
  }, [deleteVenue]);

  const handleUploadMenu = useCallback(async (
    venueId: string, 
    venueName: string, 
    file: File
  ) => {
    await uploadVenueMenu({ venueId, venueName, file });
  }, [uploadVenueMenu]);

  const handleUploadVenueLogo = useCallback(async (
    venueId: string, 
    venueName: string, 
    file: File
  ) => {
    await uploadVenueLogo({ venueId, venueName, file });
  }, [uploadVenueLogo]);

  const handleCompleteVenueStep = useCallback(async () => {
    await completeVenueStep();
  }, [completeVenueStep]);

  return {
    handleAddVenue,
    handleUpdateVenue,
    handleRemoveVenue,
    handleUploadMenu,
    handleUploadVenueLogo,
    handleCompleteVenueStep,
  };
}
