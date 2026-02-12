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
 * 2. Must be a client role (admins are redirected to /admin/portal/:slug)
 * 3. Must have a client assigned - redirect to error page if not
 */
export function PortalRoute({ children }: PortalRouteProps) {
  const { isAuthenticated, loading: authLoading, role } = useAuthContext();
  const { clientId, isLoading: clientLoading, error } = useClient();

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
    const currentPath = window.location.pathname + window.location.search;
    const emailParam = new URLSearchParams(window.location.search).get("email");
    const loginUrl = `/portal/login?returnTo=${encodeURIComponent(currentPath)}${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ""}`;
    return <Navigate to={loginUrl} replace />;
  }

  // Check role - no role yet, resolve via post-auth
  if (!role) {
    return <Navigate to="/post-auth" replace />;
  }

  // Admin user on a portal route — redirect to the admin portal equivalent
  if (hasDashboardAccess(role)) {
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    // URL is /portal/:slug — pathParts = ["portal", slug]
    const slug = pathParts.length >= 2 && pathParts[0] === "portal" ? pathParts[1] : null;
    const target = slug ? `/admin/portal/${slug}` : "/admin/portal";
    return <Navigate to={target} replace />;
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
