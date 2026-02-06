import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
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
  const location = useLocation();
  const forceAuth = new URLSearchParams(location.search).get("force") === "1";

  // Don't block rendering of the auth page if auth loading stalls.
  // This prevents a "blank" spinner screen when navigating back to /auth.
  if (loading) {
    return <>{children}</>;
  }

  // When force=1, always show the auth UI (used by "Back to Login" in preview).
  if (forceAuth) {
    return <>{children}</>;
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
