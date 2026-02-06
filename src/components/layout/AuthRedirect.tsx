import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { isClient, hasDashboardAccess } from "@/lib/auth";

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * Redirects authenticated users to their appropriate dashboard based on role:
 * - client -> /portal
 * - admin/ops_manager/support -> /dashboard (/)
 * - unauthenticated -> shows children (auth page)
 */
export function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated, loading, role } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect based on role
    if (isClient(role)) {
      return <Navigate to="/portal" replace />;
    }
    if (hasDashboardAccess(role)) {
      return <Navigate to="/" replace />;
    }
    // User is authenticated but has no role - show auth page with message
    // This shouldn't happen normally, but handle it gracefully
  }

  return <>{children}</>;
}
