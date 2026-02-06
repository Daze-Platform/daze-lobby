import { useState } from "react";
import { useHotel } from "@/contexts/HotelContext";
import { useClientPortal } from "@/hooks/useClientPortal";
import { useAuthContext } from "@/contexts/AuthContext";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
import { AdminHotelSwitcher } from "@/components/portal/AdminHotelSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Building2 } from "lucide-react";
import { signOut, hasDashboardAccess } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import dazeLogo from "@/assets/daze-logo.png";
import type { Venue } from "@/components/portal/VenueCard";

export default function Portal() {
  const { user, role } = useAuthContext();
  const { hotel, hotelId, isAdminViewing, selectedHotelId } = useHotel();
  const navigate = useNavigate();
  const [localVenues, setLocalVenues] = useState<Venue[]>([]);
  
  const isAdmin = hasDashboardAccess(role);
  
  const { 
    tasks, 
    venues,
    isLoading, 
    progress, 
    status, 
    signLegal,
    updateTask, 
    uploadFile,
    saveVenues,
    isSigningLegal,
    isUpdating
  } = useClientPortal();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleLegalSign = (signatureDataUrl: string) => {
    signLegal({ signatureDataUrl });
  };

  const handleTaskUpdate = (taskKey: string, data: Record<string, unknown>) => {
    updateTask({ taskKey, data });
  };

  const handleFileUpload = (taskKey: string, file: File, fieldName: string) => {
    uploadFile({ taskKey, file, fieldName });
  };

  const handleVenuesSave = () => {
    saveVenues(localVenues);
  };

  // Sync venues from server when loaded
  const displayVenues = localVenues.length > 0 ? localVenues : venues;

  // Admin without selected hotel - show hotel picker
  if (isAdmin && !selectedHotelId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={dazeLogo} alt="Daze" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <AdminHotelSwitcher />
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-16">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Admin Portal View</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Select a hotel from the dropdown above to view their onboarding portal and debug their progress.
              </p>
              <AdminHotelSwitcher />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Format tasks for the accordion - now with venue step
  const formattedTasks = tasks.length > 0 
    ? tasks.map(t => ({
        key: t.task_key,
        name: t.task_name,
        isCompleted: t.is_completed,
        data: t.data as Record<string, unknown>,
      }))
    : [
        { key: "legal", name: "Legal & Agreements", isCompleted: false, data: {} },
        { key: "brand", name: "Brand Identity", isCompleted: false, data: {} },
        { key: "venue", name: "Venue Manager", isCompleted: false, data: {} },
      ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dazeLogo} alt="Daze" className="h-8 w-auto" />
            {isAdminViewing && (
              <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                Admin Viewing
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && <AdminHotelSwitcher />}
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {hotel?.name || "Partner"}
          </h1>
          <p className="text-muted-foreground">
            Complete the steps below to get your hotel ready for launch.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Hero Section - Progress */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Onboarding Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <ProgressRing progress={progress} />
              <StatusBadge status={status} />
            </CardContent>
          </Card>

          {/* Task List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Setup Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskAccordion 
                tasks={formattedTasks}
                onLegalSign={handleLegalSign}
                onTaskUpdate={handleTaskUpdate}
                onFileUpload={handleFileUpload}
                venues={displayVenues}
                onVenuesChange={setLocalVenues}
                onVenuesSave={handleVenuesSave}
                isSigningLegal={isSigningLegal}
                isUpdating={isUpdating}
              />
            </CardContent>
          </Card>
        </div>

        {/* No Hotel Assigned State (shouldn't reach here due to routing) */}
        {!hotel && !isLoading && (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No hotel has been assigned to your account yet. 
                Please contact your Daze representative.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
