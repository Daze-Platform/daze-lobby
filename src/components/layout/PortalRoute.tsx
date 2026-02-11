import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useClient } from "@/contexts/ClientContext";
import { Loader2 } from "lucide-react";
import { isClient, hasDashboardAccess, signOut } from "@/lib/auth";
import NoHotelAssigned from "@/pages/NoHotelAssigned";
import { useEffect, useState } from "react";

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
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);

  const isAdminUser = hasDashboardAccess(role);

  // Sign out admin users who landed on a client portal route
  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdminUser && !signingOut) {
      setSigningOut(true);
      signOut().catch(() => {}).finally(() => {
        // After sign-out, redirect will happen via the !isAuthenticated check below
      });
    }
  }, [authLoading, isAuthenticated, isAdminUser, signingOut]);

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
    const currentPath = window.location.pathname;
    return <Navigate to={`/portal/login?returnTo=${encodeURIComponent(currentPath)}`} replace />;
  }

  // Check role - redirect admins to their dedicated route
  if (!role) {
    return <Navigate to="/post-auth" replace />;
  }

  // Admins are being signed out — show loader while that completes
  if (isAdminUser || signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Must be a client role to access /portal
  if (!isClient(role)) {
    return <Navigate to="/portal/login" replace />;
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
