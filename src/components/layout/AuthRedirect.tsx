import { Navigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * Wrapper for /auth and /portal/login that prevents logged-in users from seeing the login UI.
 * Redirect resolution happens in /post-auth. Preserves returnTo for portal users.
 */
export function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated, loading } = useAuthContext();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Preserve returnTo and origin so PostAuth sends users to the right place
    const returnTo = searchParams.get("returnTo");
    const origin = searchParams.get("origin");
    const qs = new URLSearchParams();
    if (returnTo) qs.set("returnTo", returnTo);
    if (origin) qs.set("origin", origin);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return <Navigate to={`/post-auth${suffix}`} replace />;
  }

  return <>{children}</>;
}
