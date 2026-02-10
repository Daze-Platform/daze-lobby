import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Navigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { useClientPortal } from "@/hooks/useClientPortal";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWelcomeTour } from "@/hooks/useWelcomeTour";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
import { ConfettiCelebration } from "@/components/portal/ConfettiCelebration";
import { WelcomeTour } from "@/components/portal/WelcomeTour";
import { ActivityFeedPanel } from "@/components/portal/ActivityFeedPanel";
import { PortalHeader, type PortalView } from "@/components/portal/PortalHeader";
import { PortalDocuments } from "@/components/portal/PortalDocuments";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, ClipboardList, FileText, Clock, Target } from "lucide-react";
import { signOut, hasDashboardAccess } from "@/lib/auth";
import { toast } from "sonner";
import type { Venue } from "@/types/venue";

/**
 * Portal - Client-only portal page
 * 
 * This page is exclusively for client users to view their onboarding progress.
 * Admin users are redirected to /portal/admin instead.
 */
export default function Portal() {
  const { user, role } = useAuthContext();
  const { client, clientId } = useClient();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [activeView, setActiveView] = useState<PortalView>("onboarding");
  const prevStatus = useRef<string | null>(null);
  
  // Welcome tour for first-time users
  const { showTour, completeTour } = useWelcomeTour(user?.id);
  
  // Unread notification count for badge
  const { unreadCount, markAsRead } = useUnreadNotificationCount(clientId);

  // Document count for badge
  const { data: documentCount = 0 } = useQuery({
    queryKey: ["documents-count", clientId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!clientId,
  });
  
  // Redirect admins to their dedicated portal route
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

  // MEMOIZED: Format tasks for the accordion - MUST be before early returns
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

  // SINGLE REACTIVE PATH: Confetti & toast celebration when status changes to live
  useEffect(() => {
    if (status === "live" && prevStatus.current !== null && prevStatus.current !== "live") {
      setShowConfetti(true);
      toast.success("🚀 Congratulations! Your property is now LIVE!");
    }
    prevStatus.current = status;
  }, [status]);

  // Redirect admin users to /portal/admin
  if (isAdmin) {
    return <Navigate to="/portal/admin" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/portal/login");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleLegalSign = (signatureDataUrl: string, legalEntityData: Record<string, unknown>) => {
    signLegal({ signatureDataUrl, legalEntityData: legalEntityData as { legal_entity_name?: string; billing_address?: string; authorized_signer_name?: string; authorized_signer_title?: string; } });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ambient dark:bg-ambient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ambient dark:bg-ambient-dark pb-24 sm:pb-20 md:pb-0">
      {/* Welcome Tour for first-time users */}
      {showTour && (
        <WelcomeTour onComplete={completeTour} />
      )}

      {/* Portal Header with Navigation - Client view (no admin elements) */}
      <PortalHeader
        activeView={activeView}
        onViewChange={setActiveView}
        isAdmin={false}
        isAdminViewing={false}
        userEmail={user?.email}
        userFullName={user?.fullName || undefined}
        userAvatarUrl={user?.avatarUrl}
        onSignOut={handleSignOut}
        onActivityFeedOpen={() => {
          markAsRead();
          setShowActivityFeed(true);
        }}
        unreadNotificationCount={unreadCount}
        documentCount={documentCount}
      />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8 lg:py-12">
        {activeView === "onboarding" ? (
          <>
            {/* Welcome Section */}
            <div className="mb-4 sm:mb-8 lg:mb-12 entrance-hero">
              <span className="label-micro mb-1 sm:mb-2 block">Your Portal</span>
              <h1 className="font-display text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-1 sm:mb-3">
                {client?.name || "Partner"}
              </h1>
              <p className="text-xs sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
                Complete the steps below to get your property ready for launch.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-6 lg:gap-8 lg:grid-cols-3">
              {/* Progress Card - Premium glass with decorative gradient accent */}
              <Card className="lg:col-span-1 entrance-hero relative overflow-hidden group">
                {/* Decorative top gradient bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-[hsl(var(--daze-sunset))]" />
                
                {/* Subtle background radial glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.04),transparent_70%)] pointer-events-none" />
                
                <CardHeader className="pb-2 sm:pb-4 px-4 sm:px-6 pt-5 sm:pt-6 relative">
                  <span className="label-micro">Progress</span>
                  <CardTitle className="text-base sm:text-xl">Onboarding</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 sm:gap-6 pt-2 sm:pt-4 px-4 sm:px-6 pb-6 relative">
                  <div className="w-full flex justify-center">
                    <ProgressRing progress={progress} status={status} size={140} className="sm:hidden" />
                    <ProgressRing progress={progress} status={status} size={180} className="hidden sm:block" />
                  </div>
                  <StatusBadge status={status} />
                  
                  {/* Completed tasks counter */}
                  <div className="w-full pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasks completed</span>
                      <span className="font-semibold tabular-nums">
                        {formattedTasks.filter(t => t.isCompleted).length} / {formattedTasks.length}
                      </span>
                    </div>
                  </div>
                  
                  <ConfettiCelebration 
                    trigger={showConfetti} 
                    onComplete={() => setShowConfetti(false)} 
                  />
                </CardContent>
              </Card>

              {/* Task List - Enhanced with step indicator */}
              <Card className="lg:col-span-2 entrance-content relative overflow-hidden">
                {/* Decorative top gradient bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/30 to-transparent" />
                
                <CardHeader className="pb-2 sm:pb-4 px-4 sm:px-6 pt-5 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="label-micro">Checklist</span>
                      <CardTitle className="text-base sm:text-xl">Setup Tasks</CardTitle>
                    </div>
                    {/* Step progress pills */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {formattedTasks.map((task, i) => (
                        <div
                          key={task.key}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-500",
                            i === 0 ? "w-6" : "w-4",
                            task.isCompleted
                              ? "bg-success"
                              : i === formattedTasks.findIndex(t => !t.isCompleted)
                                ? "bg-primary animate-pulse"
                                : "bg-muted-foreground/20"
                          )}
                        />
                      ))}
                    </div>
                  </div>
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

        {/* No Client Assigned State (shouldn't reach here due to routing) */}
        {!client && !isLoading && (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No client has been assigned to your account yet. 
                Please contact your Daze representative.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Mobile Bottom Navigation - Client only (no admin switcher) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-pb">
        <div className="flex items-center justify-around py-2 px-4">
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
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Sign Out</span>
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
