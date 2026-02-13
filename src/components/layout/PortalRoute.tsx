import { Navigate, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useClient } from "@/contexts/ClientContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { isClient, hasDashboardAccess, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import NoHotelAssigned from "@/pages/NoHotelAssigned";

interface PortalRouteProps {
  children: React.ReactNode;
}

export function PortalRoute({ children }: PortalRouteProps) {
  const { isAuthenticated, loading: authLoading, role, user } = useAuthContext();
  const { clientId, isLoading: clientLoading, error } = useClient();
  const navigate = useNavigate();
  const [switchingAccount, setSwitchingAccount] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const currentPath = window.location.pathname + window.location.search;
    const searchParams = new URLSearchParams(window.location.search);
    const emailParam = searchParams.get("email");
    const nameParam = searchParams.get("name");
    const loginUrl = `/portal/login?returnTo=${encodeURIComponent(currentPath)}${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ""}${nameParam ? `&name=${encodeURIComponent(nameParam)}` : ""}`;
    return <Navigate to={loginUrl} replace />;
  }

  if (!role) {
    return <Navigate to="/post-auth" replace />;
  }

  // Admin user on a portal route — check if the link is meant for someone else
  if (hasDashboardAccess(role)) {
    const searchParams = new URLSearchParams(window.location.search);
    const targetEmail = searchParams.get("email");

    // If ?email= is present and doesn't match the signed-in user, show interstitial
    if (targetEmail && user?.email && targetEmail.toLowerCase() !== user.email.toLowerCase()) {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      const slug = pathParts.length >= 2 && pathParts[0] === "portal" ? pathParts[1] : null;
      const currentPath = window.location.pathname + window.location.search;

      const handleSwitchAccount = async () => {
        setSwitchingAccount(true);
        try {
          await signOut();
        } catch {
          // signOut may throw if session already invalid
        }
        navigate(`/portal/login?returnTo=${encodeURIComponent(currentPath)}&email=${encodeURIComponent(targetEmail)}`, { replace: true });
      };

      const handleContinueAsAdmin = () => {
        const target = slug ? `/admin/portal/${slug}` : "/admin/portal";
        navigate(target, { replace: true });
      };

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                <h2 className="text-lg font-semibold">This link is for someone else</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                This link was created for <span className="font-medium text-foreground">{targetEmail}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                You're currently signed in as <span className="font-medium text-foreground">{user.email}</span>.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleContinueAsAdmin}
                >
                  Continue as Admin
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

    // No email mismatch — redirect to admin portal as usual
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const slug = pathParts.length >= 2 && pathParts[0] === "portal" ? pathParts[1] : null;
    const target = slug ? `/admin/portal/${slug}` : "/admin/portal";
    return <Navigate to={target} replace />;
  }

  if (!isClient(role)) {
    return <Navigate to="/portal/login" replace />;
  }

  // For slug-based routes (/portal/:slug), skip the client-loading gate
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const isSlugRoute = pathSegments.length >= 2 && pathSegments[0] === "portal";

  if (!isSlugRoute) {
    if (clientLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (error === "no_client_assigned" || !clientId) {
      return <NoHotelAssigned />;
    }
  }

  return <>{children}</>;
}
