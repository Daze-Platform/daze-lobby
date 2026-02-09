import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { useClientPortal } from "@/hooks/useClientPortal";
import { useAuthContext } from "@/contexts/AuthContext";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
import { ConfettiCelebration } from "@/components/portal/ConfettiCelebration";
import { AdminClientSwitcher } from "@/components/portal/AdminClientSwitcher";
import { ActivityFeedPanel } from "@/components/portal/ActivityFeedPanel";
import { PortalHeader, type PortalView } from "@/components/portal/PortalHeader";
import { PortalDocuments } from "@/components/portal/PortalDocuments";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Building2, ClipboardList, FileText, Clock } from "lucide-react";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import dazeLogo from "@/assets/daze-logo.png";
import type { Venue } from "@/types/venue";

/**
 * PortalAdmin - Admin-only portal viewer with hotel switcher
 * 
 * This page is for Control Tower users (admin/ops_manager/support) to view
 * and debug client portals. It shows the AdminHotelSwitcher prominently
 * and displays the selected client's portal.
 */
export default function PortalAdmin() {
  const { user } = useAuthContext();
  const { client, clientId, selectedClientId } = useClient();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [activeView, setActiveView] = useState<PortalView>("onboarding");
  const prevStatus = useRef<string | null>(null);
  
  // Unread notification count for badge
  const { unreadCount, markAsRead } = useUnreadNotificationCount(clientId);
  
  const { 
    tasks, 
    venues,
    isLoading, 
    progress, 
    status, 
    signLegal,
    updateTask, 
    uploadFile,
    uploadVenueMenu,
    uploadVenueLogo,
    addVenue,
    updateVenue,
    deleteVenue,
    completeVenueStep,
    isSigningLegal,
    isUpdating,
    isAddingVenue,
    isUpdatingVenue,
    isDeletingVenue,
  } = useClientPortal();

  // MEMOIZED: Format tasks for the accordion
  const formattedTasks = useMemo(() => 
    tasks.length > 0 
      ? tasks.map(t => ({
          key: t.task_key,
          name: t.task_name,
          isCompleted: t.is_completed,
          data: t.data as Record<string, unknown>,
        }))
      : [
          { key: "brand", name: "Brand Identity", isCompleted: false, data: {} },
          { key: "venue", name: "Venue Manager", isCompleted: false, data: {} },
          { key: "pos", name: "POS Integration", isCompleted: false, data: {} },
          { key: "devices", name: "Device Setup", isCompleted: false, data: {} },
          { key: "legal", name: "Legal & Agreements", isCompleted: false, data: {} },
        ],
    [tasks]
  );

  // Confetti celebration when status changes to live
  useEffect(() => {
    if (status === "live" && prevStatus.current !== null && prevStatus.current !== "live") {
      setShowConfetti(true);
      toast.success("🚀 Congratulations! This property is now LIVE!");
    }
    prevStatus.current = status;
  }, [status]);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

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

  const handleTaskUpdate = (taskKey: string, data: Record<string, unknown>) => {
    updateTask({ taskKey, data });
  };

  const handleFileUpload = (taskKey: string, file: File, fieldName: string) => {
    uploadFile({ taskKey, file, fieldName });
  };

  // Venue CRUD handlers
  const handleAddVenue = async (): Promise<Venue | undefined> => {
    const result = await addVenue({ name: "" });
    if (result) {
      return {
        id: result.id,
        name: result.name,
        menuPdfUrl: (result as { menu_pdf_url?: string | null }).menu_pdf_url || undefined,
        logoUrl: (result as { logo_url?: string | null }).logo_url || undefined,
      };
    }
    return undefined;
  };

  const handleUpdateVenue = async (id: string, updates: { name?: string; menuPdfUrl?: string; logoUrl?: string }) => {
    await updateVenue({ id, updates });
  };

  const handleRemoveVenue = async (id: string) => {
    await deleteVenue(id);
  };

  const handleUploadMenu = async (venueId: string, venueName: string, file: File) => {
    await uploadVenueMenu({ venueId, venueName, file });
  };

  const handleUploadVenueLogo = async (venueId: string, venueName: string, file: File) => {
    await uploadVenueLogo({ venueId, venueName, file });
  };

  const handleCompleteVenueStep = async () => {
    await completeVenueStep();
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
                Select a client from the dropdown to view their onboarding portal and debug their progress.
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24 sm:pb-20 md:pb-0">
      {/* Portal Header with Navigation - Admin view */}
      <PortalHeader
        activeView={activeView}
        onViewChange={setActiveView}
        isAdmin={true}
        isAdminViewing={true}
        userEmail={user?.email}
        onSignOut={handleBackToDashboard}
        onActivityFeedOpen={() => {
          markAsRead();
          setShowActivityFeed(true);
        }}
        unreadNotificationCount={unreadCount}
      />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8 lg:py-12">
        {activeView === "onboarding" ? (
          <>
            {/* Welcome Section */}
            <div className="mb-4 sm:mb-8 lg:mb-12 entrance-hero">
              <span className="label-micro mb-1 sm:mb-2 block">Admin View</span>
              <h1 className="font-display text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-1 sm:mb-3">
                {client?.name || "Partner"}
              </h1>
              <p className="text-xs sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
                Viewing client onboarding progress as an administrator.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-6 lg:gap-8 lg:grid-cols-3">
              {/* Progress Card */}
              <Card className="lg:col-span-1 entrance-hero">
                <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
                  <span className="label-micro">Progress</span>
                  <CardTitle className="text-base sm:text-xl">Onboarding</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 sm:gap-6 pt-0 sm:pt-2 px-3 sm:px-6 pb-4">
                  <div className="w-full flex justify-center">
                    <ProgressRing progress={progress} status={status} size={140} className="sm:hidden" />
                    <ProgressRing progress={progress} status={status} size={160} className="hidden sm:block" />
                  </div>
                  <StatusBadge status={status} />
                  <ConfettiCelebration 
                    trigger={showConfetti} 
                    onComplete={() => setShowConfetti(false)} 
                  />
                </CardContent>
              </Card>

              {/* Task List */}
              <Card className="lg:col-span-2 entrance-content">
                <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
                  <span className="label-micro">Checklist</span>
                  <CardTitle className="text-base sm:text-xl">Setup Tasks</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 sm:pt-2 px-1.5 sm:px-4 md:px-6">
                  <TaskAccordion 
                    tasks={formattedTasks}
                    onLegalSign={handleLegalSign}
                    onTaskUpdate={handleTaskUpdate}
                    onFileUpload={handleFileUpload}
                    venues={venues}
                    onAddVenue={handleAddVenue}
                    onUpdateVenue={handleUpdateVenue}
                    onRemoveVenue={handleRemoveVenue}
                    onUploadMenu={handleUploadMenu}
                    onUploadVenueLogo={handleUploadVenueLogo}
                    onCompleteVenueStep={handleCompleteVenueStep}
                    isAddingVenue={isAddingVenue}
                    isUpdatingVenue={isUpdatingVenue}
                    isDeletingVenue={isDeletingVenue}
                    isSigningLegal={isSigningLegal}
                    isUpdating={isUpdating}
                    hotelLegalEntity={{
                      legal_entity_name: client?.legal_entity_name || undefined,
                      billing_address: client?.billing_address || undefined,
                      authorized_signer_name: client?.authorized_signer_name || undefined,
                      authorized_signer_title: client?.authorized_signer_title || undefined,
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <PortalDocuments />
        )}

        {/* No Client Selected State */}
        {!client && !isLoading && (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Select a client using the switcher above to view their portal.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-pb">
        <div className="flex items-center justify-around py-2 px-4">
          <div className="flex-1 flex justify-center max-w-[120px]">
            <AdminClientSwitcher />
          </div>
          
          <Button
            variant={activeView === "onboarding" ? "secondary" : "ghost"}
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
            onClick={() => setActiveView("onboarding")}
          >
            <ClipboardList className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Onboarding</span>
          </Button>

          <Button
            variant={activeView === "documents" ? "secondary" : "ghost"}
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
            onClick={() => setActiveView("documents")}
          >
            <FileText className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Documents</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px] relative"
            onClick={() => {
              markAsRead();
              setShowActivityFeed(true);
            }}
          >
            <Clock className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Activity</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
            onClick={handleBackToDashboard}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Dashboard</span>
          </Button>
        </div>
      </nav>

      {/* Activity Feed Panel */}
      <ActivityFeedPanel
        open={showActivityFeed}
        onClose={() => setShowActivityFeed(false)}
        hotelId={clientId}
      />
    </div>
  );
}
