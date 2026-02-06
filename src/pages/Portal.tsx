import { useState, useEffect, useRef } from "react";
import { useHotel } from "@/contexts/HotelContext";
import { useClientPortal } from "@/hooks/useClientPortal";
import { useAuthContext } from "@/contexts/AuthContext";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
import { ConfettiCelebration } from "@/components/portal/ConfettiCelebration";
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
  const [showConfetti, setShowConfetti] = useState(false);
  const prevStatus = useRef<string | null>(null);
  
  const isAdmin = hasDashboardAccess(role);
  
  const { 
    tasks, 
    venues,
    isLoading, 
    progress, 
    status, 
    signLegal,
    saveLegalEntity,
    updateTask, 
    uploadFile,
    saveVenues,
    isSigningLegal,
    isSavingLegalEntity,
    isUpdating
  } = useClientPortal();

  // Trigger confetti when status changes to live
  useEffect(() => {
    if (status === "live" && prevStatus.current !== null && prevStatus.current !== "live") {
      setShowConfetti(true);
      toast.success("🚀 Congratulations! Your hotel is now LIVE!");
    }
    prevStatus.current = status;
  }, [status]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleLegalSign = (signatureDataUrl: string, legalEntityData: {
    legal_entity_name?: string;
    billing_address?: string;
    authorized_signer_name?: string;
    authorized_signer_title?: string;
  }) => {
    signLegal({ signatureDataUrl, legalEntityData });
  };

  const handleSaveLegalEntity = (data: {
    legal_entity_name?: string;
    billing_address?: string;
    authorized_signer_name?: string;
    authorized_signer_title?: string;
  }) => {
    saveLegalEntity(data);
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
      <div className="min-h-screen bg-muted/30">
        <header className="glass-header">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={dazeLogo} alt="Daze" className="h-10 w-auto" />
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
          <Card className="max-w-lg mx-auto shadow-soft-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <span className="label-micro">Admin Portal</span>
              <CardTitle className="text-xl">Select a Hotel</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
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
    <div className="min-h-screen bg-muted/30">
      {/* Glass Header - Immediate entrance */}
      <header className="glass-header entrance-header">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={dazeLogo} alt="Daze" className="h-10 w-auto" />
            {isAdminViewing && (
              <Badge variant="secondary" className="bg-warning/10 text-warning border-0 font-bold uppercase tracking-wide text-2xs">
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
      <main className="container mx-auto px-6 py-12">
        {/* Welcome Section - Hero entrance */}
        <div className="mb-12 entrance-hero">
          <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
            Welcome, {hotel?.name || "Partner"}
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete the steps below to get your hotel ready for launch.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Hero Section - Progress */}
          <Card className="lg:col-span-1 entrance-hero">
            <CardHeader className="pb-4">
              <span className="label-micro">Progress</span>
              <CardTitle className="text-xl">Onboarding</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 pt-2">
              <ProgressRing progress={progress} status={status} />
              <StatusBadge status={status} />
              <ConfettiCelebration 
                trigger={showConfetti} 
                onComplete={() => setShowConfetti(false)} 
              />
            </CardContent>
          </Card>

          {/* Task List - Content entrance */}
          <Card className="lg:col-span-2 entrance-content">
            <CardHeader className="pb-4">
              <span className="label-micro">Checklist</span>
              <CardTitle className="text-xl">Setup Tasks</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <TaskAccordion 
                tasks={formattedTasks}
                onLegalSign={handleLegalSign}
                onSaveLegalEntity={handleSaveLegalEntity}
                onTaskUpdate={handleTaskUpdate}
                onFileUpload={handleFileUpload}
                venues={displayVenues}
                onVenuesChange={setLocalVenues}
                onVenuesSave={handleVenuesSave}
                isSigningLegal={isSigningLegal}
                isSavingLegalEntity={isSavingLegalEntity}
                isUpdating={isUpdating}
                hotelLegalEntity={{
                  legal_entity_name: hotel?.legal_entity_name || undefined,
                  billing_address: hotel?.billing_address || undefined,
                  authorized_signer_name: hotel?.authorized_signer_name || undefined,
                  authorized_signer_title: hotel?.authorized_signer_title || undefined,
                }}
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
