import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useClient } from "@/contexts/ClientContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { isClient, hasDashboardAccess, signOut } from "@/lib/auth";
import NoHotelAssigned from "@/pages/NoHotelAssigned";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PortalRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route for the Client Portal (client users only):
 * 1. Must be authenticated
 * 2. Must be a client role (admins see a "wrong account" card)
 * 3. Must have a client assigned - redirect to error page if not
 */
export function PortalRoute({ children }: PortalRouteProps) {
  const { isAuthenticated, loading: authLoading, role, user } = useAuthContext();
  const { clientId, isLoading: clientLoading, error } = useClient();
  const navigate = useNavigate();
  const [switchingAccount, setSwitchingAccount] = useState(false);

  const isAdminUser = hasDashboardAccess(role);

  // Still loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    const currentPath = window.location.pathname;
    return <Navigate to={`/portal/login?returnTo=${encodeURIComponent(currentPath)}`} replace />;
  }

  // Check role - no role yet, resolve via post-auth
  if (!role) {
    return <Navigate to="/post-auth" replace />;
  }

  // Admin user on a portal route — show choice card instead of silently destroying session
  if (isAdminUser) {
    const handleSwitchAccount = async () => {
      setSwitchingAccount(true);
      try {
        await signOut();
      } catch {
        // signOut may throw if session already invalid
      }
      setSwitchingAccount(false);
      navigate("/portal/login", { replace: true });
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
              You're signed in as <span className="font-medium text-foreground">{user?.email}</span> (Dashboard account).
            </p>
            <p className="text-sm text-muted-foreground">
              To access the Partner Portal, sign out and use your hotel partner email.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/dashboard", { replace: true })}
              >
                Go to Dashboard
              </Button>
              <Button
                className="flex-1"
                onClick={handleSwitchAccount}
                disabled={switchingAccount}
              >
                {switchingAccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Switch to Portal Account"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Must be a client role to access /portal
  if (!isClient(role)) {
    return <Navigate to="/portal/login" replace />;
  }

  // Client role - check if client is assigned
  if (clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No client assigned - show error page
  if (error === "no_client_assigned" || !clientId) {
    return <NoHotelAssigned />;
  }

  return <>{children}</>;
}
