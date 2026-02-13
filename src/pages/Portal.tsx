import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import { Loader2 } from "lucide-react";
import { ClipboardText, FileText, Clock, Target, SignOut } from "@phosphor-icons/react";
import { signOut, hasDashboardAccess } from "@/lib/auth";
import { toast } from "sonner";
import type { Venue } from "@/types/venue";
import type { PilotAgreementData } from "@/types/pilotAgreement";

/**
 * Portal - Pure portal view component.
 * 
 * Renders identically for clients and admins. Routing guards handle access control.
 * The only difference: admins see the client switcher in the header.
 */
export default function Portal() {
  const { user, role } = useAuthContext();
  const { client, clientId } = useClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [activeView, setActiveView] = useState<PortalView>("onboarding");
  const prevStatus = useRef<string | null>(null);
  
  // Determine if admin is viewing
  const isAdmin = hasDashboardAccess(role);
  const isAdminViewingPortal = isAdmin && location.pathname.startsWith("/admin/portal");
  
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

  const { 
    tasks, venues, isLoading, progress, status,
    signLegal, updateTask, uploadFile, removeTaskKeys,
    uploadVenueMenu, uploadVenueLogo, uploadVenueAdditionalLogo, deleteVenueMenu,
    addVenue, updateVenue, deleteVenue, completeVenueStep,
    isSigningLegal, isUpdating, isAddingVenue, isUpdatingVenue, isDeletingVenue,
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

  // MEMOIZED: Legal entity data for ReviewSignModal (stable reference prevents re-render resets)
  const hotelLegalEntity = useMemo(() => {
    const legalTaskData = formattedTasks.find(t => t.key === "legal")?.data as Record<string, unknown> || {};
    return {
      ...legalTaskData,
      legal_entity_name: client?.legal_entity_name || legalTaskData?.legal_entity_name,
      billing_address: client?.billing_address || legalTaskData?.billing_address,
      authorized_signer_name: client?.authorized_signer_name || legalTaskData?.authorized_signer_name,
      authorized_signer_title: client?.authorized_signer_title || legalTaskData?.authorized_signer_title,
    } as PilotAgreementData;
  }, [formattedTasks, client]);

  // Confetti & toast celebration when status changes to live
  useEffect(() => {
    if (status === "live" && prevStatus.current !== null && prevStatus.current !== "live") {
      setShowConfetti(true);
      toast.success("🚀 Congratulations! Your property is now LIVE!");
    }
    prevStatus.current = status;
  }, [status]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate(isAdmin ? "/auth" : "/portal/login");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleLegalSign = (signatureDataUrl: string, legalEntityData: Record<string, unknown>) => {
    signLegal({ signatureDataUrl, legalEntityData: legalEntityData as { legal_entity_name?: string; billing_address?: string; authorized_signer_name?: string; authorized_signer_title?: string; } });
  };

  const handleSaveLegalDraft = useCallback(async (draftData: Record<string, unknown>) => {
    if (!clientId) return;
    try {
      // Save 4 core fields to clients table
      const { error: clientError } = await supabase
        .from("clients")
        .update({
          legal_entity_name: (draftData.legal_entity_name as string) || null,
          billing_address: (draftData.billing_address as string) || null,
          authorized_signer_name: (draftData.authorized_signer_name as string) || null,
          authorized_signer_title: (draftData.authorized_signer_title as string) || null,
        })
        .eq("id", clientId);
      if (clientError) throw clientError;

      // Atomic merge at DB level — prevents race conditions with concurrent signature saves
      const { error: taskError } = await supabase.rpc("merge_task_data", {
        p_client_id: clientId,
        p_task_key: "legal",
        p_merge_data: draftData as unknown as import("@/integrations/supabase/types").Json,
        p_remove_keys: [],
        p_mark_completed: false,
      });
      if (taskError) throw taskError;

      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
    } catch {
      // Silent fail for draft save — don't block user
      console.warn("Failed to save legal draft");
    }
  }, [clientId]);

  const handleTaskUpdate = (taskKey: string, data: Record<string, unknown>) => {
    updateTask({ taskKey, data });
  };

  const handleFileUpload = (taskKey: string, file: File, fieldName: string) => {
    uploadFile({ taskKey, file, fieldName });
  };

  const handleAddVenue = useCallback(async (): Promise<Venue | undefined> => {
    const result = await addVenue({ name: "" });
    if (result) {
      return {
        id: result.id,
        name: result.name,
        menuPdfUrl: (result as { menu_pdf_url?: string | null }).menu_pdf_url || undefined,
        logoUrl: (result as { logo_url?: string | null }).logo_url || undefined,
        menus: [],
        colorPalette: [],
      };
    }
    return undefined;
  }, [addVenue]);

  const handleUpdateVenue = useCallback(async (id: string, updates: { name?: string; menuPdfUrl?: string; logoUrl?: string }) => {
    await updateVenue({ id, updates });
  }, [updateVenue]);

  const handleRemoveVenue = useCallback(async (id: string) => {
    await deleteVenue(id);
  }, [deleteVenue]);

  const handleUploadMenu = useCallback(async (venueId: string, venueName: string, file: File) => {
    await uploadVenueMenu({ venueId, venueName, file });
  }, [uploadVenueMenu]);

  const handleUploadVenueLogo = useCallback(async (venueId: string, venueName: string, file: File) => {
    await uploadVenueLogo({ venueId, venueName, file });
  }, [uploadVenueLogo]);

  const handleUploadVenueAdditionalLogo = useCallback(async (venueId: string, venueName: string, file: File) => {
    await uploadVenueAdditionalLogo({ venueId, venueName, file });
  }, [uploadVenueAdditionalLogo]);

  const handleCompleteVenueStep = useCallback(async () => {
    await completeVenueStep();
  }, [completeVenueStep]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ambient dark:bg-ambient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ambient dark:bg-ambient-dark pb-28 sm:pb-24 md:pb-0">
      {showTour && <WelcomeTour onComplete={completeTour} />}

      <PortalHeader
        activeView={activeView}
        onViewChange={setActiveView}
        isAdmin={isAdminViewingPortal}
        isAdminViewing={isAdminViewingPortal}
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
        onBackToDashboard={isAdminViewingPortal ? () => navigate("/dashboard") : undefined}
      />

      <main className="container mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8 lg:py-12">
        {activeView === "onboarding" ? (
          <>
            <div className="mb-4 sm:mb-6 lg:mb-10 entrance-hero">
              <span className="label-micro mb-1 block">Your Portal</span>
              <h1 className="font-display text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-0.5 sm:mb-1.5">
                👋 {isAdminViewingPortal ? (client?.name || "Partner") : (user?.fullName?.split(" ")[0] || "Partner")}
              </h1>
              <p className="text-xs sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
                Complete the steps below to get your property ready for launch.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-6 lg:gap-8 lg:grid-cols-3">
              <Card className="lg:col-span-1 entrance-hero relative overflow-hidden border-t-2 border-primary shadow-md">
                <CardHeader className="pb-2 sm:pb-4 px-4 sm:px-6 pt-5 sm:pt-6">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                    <span className="label-micro">Progress</span>
                  </div>
                  <CardTitle className="text-base sm:text-xl">Onboarding</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 sm:gap-6 pt-2 sm:pt-4 px-4 sm:px-6 pb-6">
                  <div className="w-full flex justify-center">
                    <ProgressRing progress={progress} status={status} size={140} className="sm:hidden" />
                    <ProgressRing progress={progress} status={status} size={180} className="hidden sm:block" />
                  </div>
                  <StatusBadge status={status} />
                  <div className="w-full border-t border-border/50" />
                   {/* Onboarding Timeline */}
                   <div className="w-full space-y-0">
                     {(() => {
                       const allComplete = formattedTasks.every(t => t.isCompleted);
                       const phase = client?.phase ?? "onboarding";
                       const startedDate = client?.created_at
                         ? format(new Date(client.created_at), "MMM d, yyyy")
                         : "In progress";
                       const milestoneLabel = client?.next_milestone ?? "Not set yet";
                       const milestoneDate = client?.next_milestone_date
                         ? format(new Date(client.next_milestone_date), "MMM d")
                         : null;
                       const launchLabel = allComplete
                         ? "Submitted for review"
                         : phase === "reviewing"
                           ? "In Review"
                           : phase === "pilot_live" || phase === "contracted"
                             ? "Live!"
                             : "TBD";

                       const nodes = [
                         { label: "Started", detail: startedDate, done: true },
                         {
                           label: "Next Milestone",
                           detail: milestoneDate ? `${milestoneLabel} — ${milestoneDate}` : milestoneLabel,
                           done: allComplete,
                           active: !allComplete,
                         },
                         { label: "Target Launch", detail: launchLabel, done: phase === "pilot_live" || phase === "contracted" },
                       ];

                       return nodes.map((node, i) => (
                         <div key={node.label} className="flex items-start gap-3">
                           {/* Dot + line connector */}
                           <div className="flex flex-col items-center">
                             <div
                               className={cn(
                                 "w-2.5 h-2.5 rounded-full mt-1 shrink-0",
                                 node.done
                                   ? "bg-success"
                                   : node.active
                                     ? "bg-primary"
                                     : "bg-muted-foreground/30"
                               )}
                             />
                             {i < nodes.length - 1 && (
                               <div className="w-px h-6 bg-border/60" />
                             )}
                           </div>
                           {/* Label + date */}
                           <div className="pb-1">
                             <p className={cn(
                               "text-xs font-medium leading-tight",
                               node.done ? "text-muted-foreground" : node.active ? "text-foreground" : "text-muted-foreground/60"
                             )}>
                               {node.label}
                             </p>
                             <p className={cn(
                               "text-[11px] leading-tight",
                               node.done ? "text-muted-foreground/70" : node.active ? "text-primary" : "text-muted-foreground/40"
                             )}>
                               {node.detail}
                             </p>
                           </div>
                         </div>
                       ));
                     })()}
                   </div>
                  <ConfettiCelebration trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 entrance-content relative overflow-hidden">
                <CardHeader className="pb-2 sm:pb-4 px-4 sm:px-6 pt-5 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="label-micro">Checklist</span>
                      <CardTitle className="text-base sm:text-xl">Setup Tasks</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {progress === 0
                          ? "Let's get started — your first step awaits."
                          : progress === 100
                            ? "All done! Your property is ready for review."
                            : progress >= 80
                              ? "Almost there — just a few more to go!"
                              : "You're making great progress."}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {formattedTasks.map((task, i) => (
                        <div key={task.key} className="flex flex-col items-center gap-0.5">
                          <div
                            className={cn(
                              "w-6 h-1.5 rounded-full transition-all duration-500",
                              task.isCompleted
                                ? "bg-success"
                                : i === formattedTasks.findIndex(t => !t.isCompleted)
                                  ? "bg-primary"
                                  : "bg-muted-foreground/20"
                            )}
                          />
                          <span className={cn(
                            "text-[9px] font-medium tabular-nums",
                            task.isCompleted
                              ? "text-success"
                              : i === formattedTasks.findIndex(t => !t.isCompleted)
                                ? "text-primary"
                                : "text-muted-foreground/40"
                          )}>
                            {i + 1}
                          </span>
                        </div>
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
                    onUploadVenueAdditionalLogo={handleUploadVenueAdditionalLogo}
                    onCompleteVenueStep={handleCompleteVenueStep}
                    onDeleteVenueMenu={deleteVenueMenu}
                    isAddingVenue={isAddingVenue}
                    isUpdatingVenue={isUpdatingVenue}
                    isDeletingVenue={isDeletingVenue}
                    isSigningLegal={isSigningLegal}
                    isUpdating={isUpdating}
                    onSaveLegalDraft={handleSaveLegalDraft}
                    onRemoveTaskKeys={removeTaskKeys}
                    hotelLegalEntity={hotelLegalEntity}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <PortalDocuments />
        )}

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

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around py-2 px-4">
          <Button
            variant={activeView === "onboarding" ? "secondary" : "ghost"}
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
            onClick={() => setActiveView("onboarding")}
          >
            <ClipboardText size={20} weight="duotone" />
            <span className="text-[10px]">Onboarding</span>
          </Button>

          <Button
            variant={activeView === "documents" ? "secondary" : "ghost"}
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
            onClick={() => setActiveView("documents")}
          >
            <FileText size={20} weight="duotone" />
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
            <Clock size={20} weight="duotone" />
            <span className="text-[10px]">Activity</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
          
          {isAdminViewingPortal ? (
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
              onClick={() => navigate("/dashboard")}
            >
              <Target size={20} weight="duotone" />
              <span className="text-[10px]">Dashboard</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
              onClick={handleSignOut}
            >
              <SignOut size={20} weight="duotone" />
              <span className="text-[10px]">Sign Out</span>
            </Button>
          )}
        </div>
      </nav>

      <ActivityFeedPanel
        open={showActivityFeed}
        onClose={() => setShowActivityFeed(false)}
        hotelId={clientId}
      />
    </div>
  );
}
