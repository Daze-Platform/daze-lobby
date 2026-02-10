import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { AdminClientSwitcher } from "@/components/portal/AdminClientSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2 } from "lucide-react";
import dazeLogo from "@/assets/daze-logo.png";
import Portal from "./Portal";

/**
 * PortalAdmin - Admin-only portal viewer with hotel switcher
 * 
 * Shows a client picker when no client is selected.
 * Once a client is selected, renders the actual Portal component
 * so admins see the exact same UI as clients.
 */
export default function PortalAdmin() {
  const { user } = useAuthContext();
  const { selectedClientId } = useClient();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // Admin without selected client - show client picker
  if (!selectedClientId) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="glass-header">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={dazeLogo} alt="Daze" className="h-8 sm:h-10 w-auto" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block">
                <AdminClientSwitcher />
              </div>
              <span className="hidden md:inline text-sm text-muted-foreground truncate max-w-[150px]">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleBackToDashboard} className="min-h-[44px] gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <Card className="max-w-lg mx-auto shadow-soft-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <span className="label-micro">Control Tower</span>
              <CardTitle className="text-lg sm:text-xl">Select a Client</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4 sm:space-y-6 px-4 sm:px-6">
              <p className="text-sm text-muted-foreground">
                Select a client from the dropdown to view their onboarding portal.
              </p>
              <AdminClientSwitcher />
              <Button 
                variant="outline" 
                onClick={handleBackToDashboard}
                className="w-full gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Client selected — render the real Portal component (identical to client view)
  return <Portal />;
}
