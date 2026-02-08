import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { hasDashboardAccess, isClient, signOut } from "@/lib/auth";

/**
 * PostAuth
 *
 * Single place to resolve "I have a session" -> "where should I go?".
 * Prevents redirect loops when role/profile rows haven't hydrated yet.
 */
export default function PostAuth() {
  const { isAuthenticated, loading, role } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showRoleMissing, setShowRoleMissing] = useState(false);

  const targetPath = useMemo(() => {
    if (!isAuthenticated) return "/auth";
    if (isClient(role)) return "/portal";
    if (hasDashboardAccess(role)) return "/dashboard";
    return null;
  }, [isAuthenticated, role]);

  // Give hydration a brief moment after sign-in to avoid flashing an error.
  useEffect(() => {
    if (loading) return;

    // If we're authenticated but still don't have a resolvable destination, wait briefly
    // before showing the "no access assigned" screen.
    if (isAuthenticated && !targetPath) {
      const t = window.setTimeout(() => setShowRoleMissing(true), 1200);
      return () => window.clearTimeout(t);
    }

    setShowRoleMissing(false);
  }, [isAuthenticated, loading, targetPath]);

  // Resolve redirects in one place (avoids <Navigate> + hook ordering issues).
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/auth", { replace: true, state: { from: location } });
      return;
    }

    if (targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, loading, location, navigate, targetPath]);

  if (loading || !isAuthenticated || (isAuthenticated && (targetPath !== null || !showRoleMissing))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Signing you in…</span>
        </div>
      </div>
    );
  }

  // Signed in but role is missing or not allowed.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account not ready</CardTitle>
          <CardDescription>
            Your account is signed in, but it doesn’t have access assigned yet.
            Please contact an admin to set your permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await signOut();
              } finally {
                navigate("/auth", { replace: true });
              }
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
