import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useClient } from "@/contexts/ClientContext";
import { Loader2 } from "lucide-react";
import { isClient, hasDashboardAccess } from "@/lib/auth";
import NoHotelAssigned from "@/pages/NoHotelAssigned";

interface PortalRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route for the Client Portal (client users only):
 * 1. Must be authenticated
 * 2. Must be a client role (admins are redirected to /portal/admin)
 * 3. Must have a client assigned - redirect to error page if not
 */
export function PortalRoute({ children }: PortalRouteProps) {
  const { isAuthenticated, loading: authLoading, role } = useAuthContext();
  const { clientId, isLoading: clientLoading, error } = useClient();

  const isAdmin = hasDashboardAccess(role);

  // Still loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  // Check role - redirect admins to their dedicated route
  if (!role) {
    return <Navigate to="/post-auth" replace />;
  }

  // Admins should use /portal/admin instead
  if (isAdmin) {
    return <Navigate to="/portal/admin" replace />;
  }

  // Must be a client role to access /portal
  if (!isClient(role)) {
    return <Navigate to="/" replace />;
  }

  // Client role - check if client is assigned
  if (clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No client assigned - show error page
  if (error === "no_client_assigned" || !clientId) {
    return <NoHotelAssigned />;
  }

  return <>{children}</>;
}
