import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { isClient, hasDashboardAccess } from "@/lib/auth";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "ops_manager" | "support" | "client")[];
}

export function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
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
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If specific roles are required, check them
  if (allowedRoles && allowedRoles.length > 0) {
    // Role is still hydrating OR missing entirely -> resolve in /post-auth to avoid loops
    if (!role) {
      return <Navigate to="/post-auth" replace />;
    }

    if (!allowedRoles.includes(role)) {
      // Redirect to appropriate route based on role
      if (isClient(role)) {
        return <Navigate to="/portal" replace />;
      }
      if (hasDashboardAccess(role)) {
        return <Navigate to="/" replace />;
      }
      return <Navigate to="/post-auth" replace />;
    }
  }

  return <>{children}</>;
}
