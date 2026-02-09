import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { hasDashboardAccess } from "@/lib/auth";

interface DedicatedPortalRouteProps {
  children: React.ReactNode;
}

/**
 * Auth guard for dedicated client portal routes (e.g. /portal/daze-beach-resort).
 * - Unauthenticated users → /portal/login with returnTo
 * - Admin/ops/support users → /portal/admin (they use the Control Tower viewer)
 * - Client users → render the dedicated portal
 */
export function DedicatedPortalRoute({ children }: DedicatedPortalRouteProps) {
  const { isAuthenticated, loading, role } = useAuthContext();
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

  // Admin/ops/support users should use the Control Tower portal viewer
  if (hasDashboardAccess(role)) {
    return <Navigate to="/portal/admin" replace />;
  }

  return <>{children}</>;
}
