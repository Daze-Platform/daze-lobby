import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { hasDashboardAccess } from "@/lib/auth";

interface Hotel {
  id: string;
  name: string;
  phase: string;
  onboarding_progress: number | null;
  brand_palette: string[] | null;
  logo_url: string | null;
  // Legal entity fields
  legal_entity_name: string | null;
  billing_address: string | null;
  authorized_signer_name: string | null;
  authorized_signer_title: string | null;
}

interface HotelContextType {
  hotel: Hotel | null;
  hotelId: string | null;
  isLoading: boolean;
  error: string | null;
  // Admin-only: ability to switch hotels
  isAdminViewing: boolean;
  selectedHotelId: string | null;
  setSelectedHotelId: (id: string | null) => void;
  allHotels: Hotel[];
  isLoadingAllHotels: boolean;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export function HotelProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading, role } = useAuthContext();
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  
  const isAdmin = hasDashboardAccess(role);

  // Fetch client's assigned hotel (for clients)
  const { 
    data: clientHotelData, 
    isLoading: isLoadingClientHotel,
    error: clientHotelError 
  } = useQuery({
    queryKey: ["client-hotel-link", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("client_hotels")
        .select(`
          hotel_id,
          hotels (
            id,
            name,
            phase,
            onboarding_progress,
            brand_palette,
            logo_url,
            legal_entity_name,
            billing_address,
            authorized_signer_name,
            authorized_signer_title
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !isAdmin && isAuthenticated,
  });

  // Fetch all hotels (for admins only)
  const { 
    data: allHotels = [], 
    isLoading: isLoadingAllHotels 
  } = useQuery({
    queryKey: ["all-hotels-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name, phase, onboarding_progress, brand_palette, logo_url")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as Hotel[];
    },
    enabled: isAdmin && isAuthenticated,
  });

  // Fetch selected hotel details (when admin selects a hotel)
  const { 
    data: selectedHotelData, 
    isLoading: isLoadingSelectedHotel 
  } = useQuery({
    queryKey: ["selected-hotel", selectedHotelId],
    queryFn: async () => {
      if (!selectedHotelId) return null;
      
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name, phase, onboarding_progress, brand_palette, logo_url")
        .eq("id", selectedHotelId)
        .single();

      if (error) throw error;
      return data as Hotel;
    },
    enabled: !!selectedHotelId && isAdmin,
  });

  // Determine the current hotel based on role
  const resolvedHotel: Hotel | null = (() => {
    if (isAdmin && selectedHotelId && selectedHotelData) {
      return selectedHotelData;
    }
    if (!isAdmin && clientHotelData?.hotels) {
      return clientHotelData.hotels as unknown as Hotel;
    }
    return null;
  })();

  const resolvedHotelId = (() => {
    if (isAdmin && selectedHotelId) {
      return selectedHotelId;
    }
    if (!isAdmin && clientHotelData?.hotel_id) {
      return clientHotelData.hotel_id;
    }
    return null;
  })();

  const isLoading = authLoading || isLoadingClientHotel || (isAdmin && selectedHotelId && isLoadingSelectedHotel);

  const error = (() => {
    if (!isAuthenticated || authLoading) return null;
    if (isAdmin && !selectedHotelId) return null; // Admin hasn't selected a hotel yet - not an error
    if (!isAdmin && !isLoadingClientHotel && !clientHotelData) {
      return "no_hotel_assigned";
    }
    if (clientHotelError) return "fetch_error";
    return null;
  })();

  return (
    <HotelContext.Provider
      value={{
        hotel: resolvedHotel,
        hotelId: resolvedHotelId,
        isLoading: !!isLoading,
        error,
        isAdminViewing: isAdmin && !!selectedHotelId,
        selectedHotelId,
        setSelectedHotelId,
        allHotels,
        isLoadingAllHotels,
      }}
    >
      {children}
    </HotelContext.Provider>
  );
}

export function useHotel() {
  const context = useContext(HotelContext);
  if (context === undefined) {
    throw new Error("useHotel must be used within a HotelProvider");
  }
  return context;
}
