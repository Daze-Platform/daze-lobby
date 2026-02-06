import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, LogOut, Mail } from "lucide-react";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import dazeLogo from "@/assets/daze-logo.png";

export default function NoHotelAssigned() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={dazeLogo} alt="Daze" className="h-8 w-auto" />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <CardTitle className="text-xl">No Hotel Assigned</CardTitle>
            <CardDescription>
              Your account hasn't been linked to a hotel property yet. 
              This is required before you can access the onboarding portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">What happens next?</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>A Daze team member will assign your hotel to your account</li>
                <li>You'll receive an email notification once complete</li>
                <li>Return here to begin the onboarding process</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full gap-2">
                <a href="mailto:support@daze.com">
                  <Mail className="w-4 h-4" />
                  Contact Support
                </a>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
