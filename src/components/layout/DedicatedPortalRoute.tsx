import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

interface DedicatedPortalRouteProps {
  children: React.ReactNode;
}

/**
 * Auth guard for dedicated client portal routes (/portal/:clientSlug).
 * - Unauthenticated users → /portal/login with returnTo
 * - All authenticated users (admin or client) → render the portal
 */
export function DedicatedPortalRoute({ children }: DedicatedPortalRouteProps) {
  const { isAuthenticated, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/portal/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
