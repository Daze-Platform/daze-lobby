import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { isClient, hasDashboardAccess, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "ops_manager" | "support" | "client")[];
}

export function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
  const { isAuthenticated, loading, role, user } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [switchingAccount, setSwitchingAccount] = useState(false);

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
      // Client user on an admin route — show informational card instead of silent redirect
      if (isClient(role)) {
        const handleSwitchAccount = async () => {
          setSwitchingAccount(true);
          try {
            await signOut();
            navigate("/auth", { replace: true });
          } catch {
            setSwitchingAccount(false);
          }
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
      if (hasDashboardAccess(role)) {
        return <Navigate to="/" replace />;
      }
      return <Navigate to="/post-auth" replace />;
    }
  }

  return <>{children}</>;
}
