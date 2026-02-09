import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

interface DedicatedPortalRouteProps {
  children: React.ReactNode;
}

/**
 * Lightweight auth guard for dedicated client portal routes (e.g. /portal/springhill-orange-beach).
 * Redirects unauthenticated users to /portal/login with a returnTo param.
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
