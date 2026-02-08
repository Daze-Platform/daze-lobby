import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * Wrapper for /auth that prevents logged-in users from seeing the login UI.
 * Redirect resolution happens in /post-auth.
 */
export function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/post-auth" replace />;
  }

  return <>{children}</>;
}
