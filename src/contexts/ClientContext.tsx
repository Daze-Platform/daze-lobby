import { createContext, useContext, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { hasDashboardAccess } from "@/lib/auth";

interface Client {
  id: string;
  name: string;
  phase: string;
  onboarding_progress: number | null;
  brand_palette: string[] | null;
  logo_url: string | null;
  client_code: string | null;
  client_slug: string | null;
  created_at: string;
  next_milestone: string | null;
  next_milestone_date: string | null;
  // Legal entity fields
  legal_entity_name: string | null;
  billing_address: string | null;
  authorized_signer_name: string | null;
  authorized_signer_title: string | null;
}

interface ClientContextType {
  client: Client | null;
  clientId: string | null;
  isLoading: boolean;
  error: string | null;
  // Admin-only: ability to switch clients
  isAdminViewing: boolean;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  allClients: Client[];
  isLoadingAllClients: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading, role } = useAuthContext();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const isAdmin = hasDashboardAccess(role);

  // Fetch user's assigned client (for client role users)
  const { 
    data: userClientData, 
    isLoading: isLoadingUserClient,
    error: userClientError 
  } = useQuery({
    queryKey: ["user-client-link", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_clients")
        .select(`
          client_id,
          clients (
            id,
            name,
            phase,
            onboarding_progress,
            brand_palette,
            logo_url,
            client_code,
            client_slug,
            created_at,
            next_milestone,
            next_milestone_date,
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

  // Fetch all clients (for admins only)
  const { 
    data: allClients = [], 
    isLoading: isLoadingAllClients 
  } = useQuery({
    queryKey: ["all-clients-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
.select("id, name, phase, onboarding_progress, brand_palette, logo_url, client_code, client_slug, created_at, next_milestone, next_milestone_date, legal_entity_name, billing_address, authorized_signer_name, authorized_signer_title")
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as Client[];
    },
    enabled: isAdmin && isAuthenticated,
  });

  // Fetch selected client details (when admin selects a client)
  const { 
    data: selectedClientData, 
    isLoading: isLoadingSelectedClient 
  } = useQuery({
    queryKey: ["selected-client", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      
      const { data, error } = await supabase
        .from("clients")
.select("id, name, phase, onboarding_progress, brand_palette, logo_url, client_code, client_slug, created_at, next_milestone, next_milestone_date, legal_entity_name, billing_address, authorized_signer_name, authorized_signer_title")
        .eq("id", selectedClientId)
        .single();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!selectedClientId && isAdmin,
  });

  // Determine the current client based on role
  const resolvedClient: Client | null = (() => {
    if (isAdmin && selectedClientId && selectedClientData) {
      return selectedClientData;
    }
    if (!isAdmin && userClientData?.clients) {
      return userClientData.clients as unknown as Client;
    }
    return null;
  })();

  const resolvedClientId = (() => {
    if (isAdmin && selectedClientId) {
      return selectedClientId;
    }
    if (!isAdmin && userClientData?.client_id) {
      return userClientData.client_id;
    }
    return null;
  })();

  const isLoading = authLoading || isLoadingUserClient || (isAdmin && selectedClientId && isLoadingSelectedClient);

  const error = (() => {
    if (!isAuthenticated || authLoading) return null;
    if (isAdmin && !selectedClientId) return null; // Admin hasn't selected a client yet - not an error
    if (!isAdmin && !isLoadingUserClient && !userClientData) {
      return "no_client_assigned";
    }
    if (userClientError) return "fetch_error";
    return null;
  })();

  return (
    <ClientContext.Provider
      value={{
        client: resolvedClient,
        clientId: resolvedClientId,
        isLoading: !!isLoading,
        error,
        isAdminViewing: isAdmin && !!selectedClientId,
        selectedClientId,
        setSelectedClientId,
        allClients,
        isLoadingAllClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
}

// Note: Type Client is now available from @/types
