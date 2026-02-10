import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useClient } from "@/contexts/ClientContext";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import Portal from "./Portal";

/**
 * AdminPortalBySlug - resolves a client slug for admin users
 * and renders the Portal component with admin context.
 * 
 * Route: /admin/portal/:clientSlug
 */
export default function AdminPortalBySlug() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const { setSelectedClientId } = useClient();

  const {
    data: client,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client-by-slug", clientSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("client_slug", clientSlug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientSlug && isAuthenticated,
  });

  useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
    return () => {
      setSelectedClientId(null);
    };
  }, [client?.id, setSelectedClientId]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Portal not found</h1>
          <p className="text-muted-foreground">
            The portal "{clientSlug}" does not exist.
          </p>
        </div>
      </div>
    );
  }

  return <Portal />;
}
