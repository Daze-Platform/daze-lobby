import { Navigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { hasDashboardAccess, isClient, forceCleanSession } from "@/lib/auth";
import { useState, useEffect } from "react";

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * Wrapper for /auth and /portal/login that prevents logged-in users from seeing the login UI.
 * Now role-aware: if the wrong role is logged in for this login page, we sign them out
 * and show the login form instead of blindly redirecting.
 */
export function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated, loading, role } = useAuthContext();
  const [searchParams] = useSearchParams();
  const [cleaningSession, setCleaningSession] = useState(false);
  const [sessionCleaned, setSessionCleaned] = useState(false);

  const isPortalLogin = window.location.pathname.startsWith("/portal/");
  const isAdminLogin = window.location.pathname === "/auth";

  // If the wrong role is authenticated, force-clean the session
  useEffect(() => {
    if (loading || !isAuthenticated || cleaningSession || sessionCleaned) return;

    const wrongRole =
      (isAdminLogin && isClient(role)) ||
      (isPortalLogin && hasDashboardAccess(role));

    if (wrongRole) {
      setCleaningSession(true);
      forceCleanSession().finally(() => {
        setCleaningSession(false);
        setSessionCleaned(true);
      });
    }
  }, [loading, isAuthenticated, role, isAdminLogin, isPortalLogin, cleaningSession, sessionCleaned]);

  if (loading || cleaningSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After cleaning a wrong-role session, or if not authenticated, show login form
  if (sessionCleaned || !isAuthenticated) {
    return <>{children}</>;
  }

  // Authenticated with the correct role — redirect to post-auth
  const returnTo = searchParams.get("returnTo");
  const origin = searchParams.get("origin");
  const qs = new URLSearchParams();
  if (returnTo) qs.set("returnTo", returnTo);

  if (origin) {
    qs.set("origin", origin);
  } else if (isPortalLogin) {
    qs.set("origin", "portal");
  }

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return <Navigate to={`/post-auth${suffix}`} replace />;
}
