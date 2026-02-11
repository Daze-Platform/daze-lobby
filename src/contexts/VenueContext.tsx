import { createContext, useContext, ReactNode, useMemo, useState, useCallback } from "react";
import type { Venue, VenueUpdate } from "@/types/venue";

/**
 * VenueContext
 * 
 * Eliminates prop drilling for venue CRUD operations across:
 * Portal → TaskAccordion → VenueStep → VenueManager → VenueCard
 * 
 * Components can now access venue state and handlers directly.
 */

interface VenueContextType {
  // State
  venues: Venue[];
  isAddingVenue: boolean;
  isUpdatingVenue: boolean;
  isDeletingVenue: boolean;
  uploadingMenuIds: Set<string>;
  uploadingLogoIds: Set<string>;
  
  // Actions
  addVenue: () => Promise<Venue | undefined>;
  updateVenue: (id: string, updates: VenueUpdate) => Promise<void>;
  removeVenue: (id: string) => Promise<void>;
  removeMenu: (venueId: string) => Promise<void>;
  removeLogo: (venueId: string) => Promise<void>;
  uploadMenu: (venueId: string, venueName: string, file: File) => Promise<void>;
  uploadLogo: (venueId: string, venueName: string, file: File) => Promise<void>;
  completeStep: () => Promise<void>;
}

const VenueContext = createContext<VenueContextType | null>(null);

interface VenueProviderProps {
  children: ReactNode;
  venues: Venue[];
  onAddVenue: () => Promise<Venue | undefined>;
  onUpdateVenue: (id: string, updates: VenueUpdate) => Promise<void>;
  onRemoveVenue: (id: string) => Promise<void>;
  onUploadMenu: (venueId: string, venueName: string, file: File) => Promise<void>;
  onUploadLogo: (venueId: string, venueName: string, file: File) => Promise<void>;
  onCompleteStep: () => Promise<void>;
  isAddingVenue?: boolean;
  isUpdatingVenue?: boolean;
  isDeletingVenue?: boolean;
}

export function VenueProvider({
  children,
  venues,
  onAddVenue,
  onUpdateVenue,
  onRemoveVenue,
  onUploadMenu,
  onUploadLogo,
  onCompleteStep,
  isAddingVenue = false,
  isUpdatingVenue = false,
  isDeletingVenue = false,
}: VenueProviderProps) {
  // Track individual upload states
  const [uploadingMenuIds, setUploadingMenuIds] = useState<Set<string>>(new Set());
  const [uploadingLogoIds, setUploadingLogoIds] = useState<Set<string>>(new Set());

  // Wrap upload handlers to track per-venue loading state
  const uploadMenu = useCallback(async (venueId: string, venueName: string, file: File) => {
    setUploadingMenuIds(prev => new Set(prev).add(venueId));
    try {
      await onUploadMenu(venueId, venueName, file);
    } finally {
      setUploadingMenuIds(prev => {
        const next = new Set(prev);
        next.delete(venueId);
        return next;
      });
    }
  }, [onUploadMenu]);

  const uploadLogo = useCallback(async (venueId: string, venueName: string, file: File) => {
    setUploadingLogoIds(prev => new Set(prev).add(venueId));
    try {
      await onUploadLogo(venueId, venueName, file);
    } finally {
      setUploadingLogoIds(prev => {
        const next = new Set(prev);
        next.delete(venueId);
        return next;
      });
    }
  }, [onUploadLogo]);

  const removeMenu = useCallback(async (venueId: string) => {
    await onUpdateVenue(venueId, { menuPdfUrl: null });
  }, [onUpdateVenue]);

  const removeLogo = useCallback(async (venueId: string) => {
    await onUpdateVenue(venueId, { logoUrl: null });
  }, [onUpdateVenue]);

  const value = useMemo<VenueContextType>(() => ({
    venues,
    isAddingVenue,
    isUpdatingVenue,
    isDeletingVenue,
    uploadingMenuIds,
    uploadingLogoIds,
    addVenue: onAddVenue,
    updateVenue: onUpdateVenue,
    removeVenue: onRemoveVenue,
    removeMenu,
    removeLogo,
    uploadMenu,
    uploadLogo,
    completeStep: onCompleteStep,
  }), [
    venues,
    isAddingVenue,
    isUpdatingVenue,
    isDeletingVenue,
    uploadingMenuIds,
    uploadingLogoIds,
    onAddVenue,
    onUpdateVenue,
    onRemoveVenue,
    removeMenu,
    removeLogo,
    uploadMenu,
    uploadLogo,
    onCompleteStep,
  ]);

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenueContext() {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error("useVenueContext must be used within a VenueProvider");
  }
  return context;
}

/**
 * Optional hook that returns null if not in VenueProvider
 * Useful for components that may be used outside the venue context
 */
export function useOptionalVenueContext() {
  return useContext(VenueContext);
}
