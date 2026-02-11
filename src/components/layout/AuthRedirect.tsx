import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { hasDashboardAccess, isClient, signOut } from "@/lib/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * Wrapper for /auth and /portal/login that prevents logged-in users from seeing the login UI.
 * Role-aware: admins on /portal/login are redirected to /admin/portal instead of destroying session.
 */
export function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated, loading, role, user } = useAuthContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [switchingAccount, setSwitchingAccount] = useState(false);

  const isPortalLogin = window.location.pathname.startsWith("/portal/");
  const isAdminLogin = window.location.pathname === "/auth";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Admin user on /portal/login — redirect to admin portal picker instead of destroying session
  if (isPortalLogin && hasDashboardAccess(role)) {
    return <Navigate to="/admin/portal" replace />;
  }

  // Client user visiting /auth — show choice card instead of silently destroying session
  if (isAdminLogin && isClient(role)) {
    const handleSwitchAccount = async () => {
      setSwitchingAccount(true);
      try {
        await signOut();
      } catch {
        // signOut may throw if session already invalid
      }
      setSwitchingAccount(false);
      // Page will re-render as unauthenticated and show login form
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
              <h2 className="text-lg font-semibold">Wrong account</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              You're signed in as <span className="font-medium text-foreground">{user?.email}</span> (Partner Portal account).
            </p>
            <p className="text-sm text-muted-foreground">
              To access the dashboard, sign out and use your <span className="font-medium text-foreground">@dazeapp.com</span> email.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/post-auth", { replace: true })}
              >
                Go to Partner Portal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSwitchAccount}
                disabled={switchingAccount}
              >
                {switchingAccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Switch Account"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
