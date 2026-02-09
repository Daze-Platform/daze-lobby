import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { hasDashboardAccess } from "@/lib/auth";

/** Portal paths that admin/ops/support users are allowed to access directly */
const ADMIN_ALLOWED_PORTAL_PATHS = ["/portal/daze-beach-resort"];

interface DedicatedPortalRouteProps {
  children: React.ReactNode;
}

/**
 * Auth guard for dedicated client portal routes (e.g. /portal/daze-beach-resort).
 * - Unauthenticated users → /portal/login with returnTo
 * - Admin/ops/support users on non-allowed paths → /portal/admin
 * - Admin/ops/support users on allowed paths → render the portal
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

  // Admin/ops/support users can only access allowlisted portal paths
  if (hasDashboardAccess(role)) {
    const isAllowed = ADMIN_ALLOWED_PORTAL_PATHS.includes(location.pathname);
    if (!isAllowed) {
      return <Navigate to="/portal/admin" replace />;
    }
  }

  return <>{children}</>;
}
