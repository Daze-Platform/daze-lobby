import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
import { ConfettiCelebration } from "@/components/portal/ConfettiCelebration";
import { WelcomeTour } from "@/components/portal/WelcomeTour";
import { DemoActivityFeedPanel, type DemoActivity } from "@/components/portal";
import { PortalHeader, type PortalView } from "@/components/portal/PortalHeader";
import { PortalDocuments } from "@/components/portal/PortalDocuments";
import { useWelcomeTour } from "@/hooks/useWelcomeTour";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileText, Clock, ArrowLeft, Target } from "lucide-react";
import { toast } from "sonner";
import type { Venue } from "@/components/portal/VenueCard";
import { signOut } from "@/lib/auth";
import { useAuthContext } from "@/contexts/AuthContext";
import { ClientProvider } from "@/contexts/ClientContext";

/**
 * Preview/Demo version of the Client Portal V2
 * Supports dynamic slug-based routes (/portal/:clientSlug) and demo mode
 */
export default function PortalPreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const previewClientId = searchParams.get("clientId");

  // Resolve client from slug
  const { data: resolvedClient } = useQuery({
    queryKey: ["client-by-slug", clientSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("client_slug", clientSlug!)
        .single();
      return data;
    },
    enabled: !!clientSlug,
    staleTime: Infinity,
  });

  const clientName = resolvedClient?.name;
  const displayName = clientName || "Grand Hyatt Demo";
  const effectiveClientId = resolvedClient?.id || previewClientId;
  const isDemo = !clientSlug;
  const [activeView, setActiveView] = useState<PortalView>("onboarding");

  // Document count for badge
  const { data: documentCount = 0 } = useQuery({
    queryKey: ["documents-count", effectiveClientId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("client_id", effectiveClientId!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!effectiveClientId,
  });
  const [status, setStatus] = useState<"onboarding" | "reviewing" | "live">("onboarding");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isSigningLegal, setIsSigningLegal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevStatus = useRef(status);
  
  // Activity Feed state
  const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
  const [demoActivities, setDemoActivities] = useState<DemoActivity[]>([
    {
      id: crypto.randomUUID(),
      action: "blocker_notification",
      userName: "Daze Team",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      details: {
        message: "Please complete your pending onboarding tasks to proceed.",
        sent_by: "Daze Support",
      },
    },
    {
      id: crypto.randomUUID(),
      action: "welcome",
      userName: "Demo User",
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
  ]);

  // Helper to log demo activities
  const logDemoActivity = (action: string, details?: Record<string, unknown>) => {
    setDemoActivities(prev => [
      {
        id: crypto.randomUUID(),
        action,
        userName: "Demo User",
        timestamp: new Date(),
        details,
      },
      ...prev,
    ]);
  };
  
  // Welcome tour - use real user ID when authenticated, fallback for demo
  const { user } = useAuthContext();
  const { showTour, completeTour, resetTour } = useWelcomeTour(user?.id || "preview-user");
  
  // Demo legal entity state
  const [hotelLegalEntity, setHotelLegalEntity] = useState({
    property_name: "",
    legal_entity_name: "",
    billing_address: "",
    authorized_signer_name: "",
    authorized_signer_title: "",
  });

  const [tasks, setTasks] = useState([
    { key: "legal", name: "Legal & Agreements", isCompleted: false, data: {} as Record<string, unknown> },
    { key: "brand", name: "Brand Identity", isCompleted: false, data: {} as Record<string, unknown> },
    { key: "venue", name: "Venue Manager", isCompleted: false, data: {} as Record<string, unknown> },
    { key: "pos", name: "POS Integration", isCompleted: false, data: {} as Record<string, unknown> },
    { key: "devices", name: "Device Setup", isCompleted: false, data: {} as Record<string, unknown> },
  ]);

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  // Trigger confetti when status changes to 'live'
  useEffect(() => {
    if (status === "live" && prevStatus.current !== "live") {
      setShowConfetti(true);
      toast.success("🚀 Congratulations! Your hotel is now LIVE!");
    }
    prevStatus.current = status;
  }, [status]);

  // Auto-transition to 'reviewing' when all tasks are complete
  useEffect(() => {
    const allComplete = tasks.every(t => t.isCompleted);
    if (allComplete && status === "onboarding") {
      // Small delay to let the final task animation play
      const timer = setTimeout(() => {
        setStatus("reviewing");
        toast.success("🎉 All tasks complete! Status changed to Reviewing.");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [tasks, status]);

  const handleSignOut = () => {
    navigate("/auth?force=1");
    void signOut().catch(() => {});
  };

  const handleResetTour = () => {
    resetTour();
    toast.info("Welcome tour reset!");
  };

  const handleLegalSign = async (signatureDataUrl: string, legalEntityData: {
    property_name?: string;
    legal_entity_name?: string;
    billing_address?: string;
    authorized_signer_name?: string;
    authorized_signer_title?: string;
  }) => {
    setIsSigningLegal(true);
    
    // Update demo legal entity state
    setHotelLegalEntity({
      property_name: legalEntityData.property_name || "",
      legal_entity_name: legalEntityData.legal_entity_name || "",
      billing_address: legalEntityData.billing_address || "",
      authorized_signer_name: legalEntityData.authorized_signer_name || "",
      authorized_signer_title: legalEntityData.authorized_signer_title || "",
    });
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const signedAt = new Date().toISOString();
    
    setTasks(prev => prev.map(task => 
      task.key === "legal" 
        ? { 
            ...task, 
            isCompleted: true, 
            data: { 
              pilot_signed: true, 
              signature_url: signatureDataUrl,
              signed_at: signedAt,
              signer_name: legalEntityData.authorized_signer_name,
              signer_title: legalEntityData.authorized_signer_title,
              legal_entity: legalEntityData.legal_entity_name,
            } 
          }
        : task
    ));
    
    // Log demo activity
    logDemoActivity("legal_signed", { 
      signer_name: legalEntityData.authorized_signer_name,
      signer_title: legalEntityData.authorized_signer_title,
    });
    
    setIsSigningLegal(false);
    toast.success("Agreement signed successfully! Next step unlocked. (Demo mode)");
  };

  const handleTaskUpdate = (taskKey: string, data: Record<string, unknown>) => {
    const task = tasks.find(t => t.key === taskKey);
    setTasks(prev => prev.map(t => 
      t.key === taskKey 
        ? { ...t, isCompleted: true, data: { ...t.data, ...data } }
        : t
    ));
    
    // Log demo activity
    logDemoActivity("task_completed", { task_name: task?.name || taskKey });
    toast.success(`Task completed! (Demo mode)`);
  };

  const handleFileUpload = (taskKey: string, file: File, fieldName: string) => {
    // Log demo activity
    logDemoActivity("logo_uploaded", { file_name: file.name, field: fieldName });
    toast.success(`File "${file.name}" uploaded. (Demo mode)`);
  };

  // Venue CRUD handlers for demo mode
  const handleAddVenue = async (): Promise<Venue | undefined> => {
    const newVenue: Venue = {
      id: crypto.randomUUID(),
      name: "",
    };
    setVenues(prev => [...prev, newVenue]);
    return newVenue;
  };

  const handleUpdateVenue = async (id: string, updates: { name?: string; menuPdfUrl?: string }) => {
    setVenues(prev => prev.map(v => 
      v.id === id ? { ...v, ...updates } : v
    ));
  };

  const handleRemoveVenue = async (id: string) => {
    setVenues(prev => prev.filter(v => v.id !== id));
    toast.success("Venue removed. (Demo mode)");
  };

  const handleUploadMenu = async (venueId: string, venueName: string, file: File) => {
    setVenues(prev => prev.map(v =>
      v.id === venueId ? { ...v, menuFileName: file.name } : v
    ));
    logDemoActivity("menu_uploaded", { venue_name: venueName, file_name: file.name });
    toast.success(`Menu uploaded for ${venueName}. (Demo mode)`);
  };

  const handleUploadVenueLogo = async (venueId: string, venueName: string, file: File) => {
    // Create a local object URL for demo preview
    const logoUrl = URL.createObjectURL(file);
    setVenues(prev => prev.map(v =>
      v.id === venueId ? { ...v, logoUrl } : v
    ));
    logDemoActivity("venue_logo_uploaded", { venue_name: venueName, file_name: file.name });
    toast.success(`Logo uploaded for ${venueName || "venue"}. (Demo mode)`);
  };

  const handleCompleteVenueStep = async () => {
    if (venues.length > 0 && venues.some(v => v.name.trim())) {
      setTasks(prev => prev.map(task =>
        task.key === "venue"
          ? { ...task, isCompleted: true, data: { venues: venues.map(v => v.name) } }
          : task
      ));
      
      logDemoActivity("venue_updated", { venue_count: venues.filter(v => v.name.trim()).length });
      toast.success("Venue step completed! (Demo mode)");
    }
  };

  return (
    <div className="min-h-screen bg-ambient dark:bg-ambient-dark pb-24 sm:pb-20 md:pb-0">
      {/* Welcome Tour */}
      {showTour && (
        <WelcomeTour onComplete={completeTour} />
      )}

      {/* Portal Header - Same component as real portal */}
      <PortalHeader
        activeView={activeView}
        onViewChange={setActiveView}
        isPreview={true}
        userEmail={clientName ? "info@springhillob.com" : "demo@grandhydatt.com"}
        userFullName={clientName || "Demo User"}
        onSignOut={handleSignOut}
        onActivityFeedOpen={() => setIsActivityFeedOpen(true)}
        activityCount={demoActivities.length}
        onResetTour={isDemo ? handleResetTour : undefined}
        documentCount={documentCount}
      />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8 lg:py-12">
        {activeView === "documents" ? (
          <ClientProvider>
            <PortalDocuments clientIdOverride={effectiveClientId} />
          </ClientProvider>
        ) : (
          <>
            {/* Welcome Section - Hero entrance */}
            <div className="mb-4 sm:mb-6 lg:mb-10 entrance-hero">
              <span className="label-micro mb-1 sm:mb-2 block">Your Portal</span>
              <h1 className="font-display text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-0.5">
                👋 {displayName}
              </h1>
              <p className="text-xs sm:text-base lg:text-lg text-muted-foreground">
                {clientName
                  ? `Welcome to the Daze onboarding portal for ${clientName}`
                  : "Complete the steps below to get your hotel ready for launch."}
              </p>
            </div>

            <div className="grid gap-3 sm:gap-6 lg:gap-8 lg:grid-cols-3">
              {/* Hero Section - Progress */}
              <Card className="lg:col-span-1 entrance-hero relative overflow-hidden border-t-2 border-primary shadow-md">
                <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                    <span className="label-micro">Progress</span>
                  </div>
                  <CardTitle className="text-base sm:text-xl">Onboarding</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 sm:gap-6 pt-0 sm:pt-2 px-3 sm:px-6 pb-4">
                  {/* Responsive Progress Ring - smaller on mobile */}
                  <div className="w-full flex justify-center">
                    <ProgressRing progress={progress} status={status} size={140} className="sm:hidden" />
                    <ProgressRing progress={progress} status={status} size={180} className="hidden sm:block" />
                  </div>
                  <StatusBadge status={status} />
                  <ConfettiCelebration 
                    trigger={showConfetti} 
                    onComplete={() => setShowConfetti(false)} 
                  />

                  {/* Tasks completed counter */}
                  <div className="w-full pt-3 sm:pt-4 border-t border-border/30">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasks completed</span>
                      <span className="font-semibold">{completedCount} / {tasks.length}</span>
                    </div>
                  </div>
                  
                  {/* Demo Status Toggle - Horizontal scroll on mobile */}
                  {isDemo && (
                  <div className="w-full pt-3 sm:pt-6 border-t border-border/20">
                    <p className="label-micro mb-2 sm:mb-3 text-center">Demo: Toggle Status</p>
                    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                      {(["onboarding", "reviewing", "live"] as const).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={status === s ? "default" : "secondary"}
                          onClick={() => setStatus(s)}
                          className="flex-1 min-w-[60px] sm:min-w-[80px] text-[10px] sm:text-xs capitalize min-h-[40px] sm:min-h-[44px] whitespace-nowrap px-2 sm:px-3"
                        >
                          {s === "reviewing" ? "In-Progress" : s}
                        </Button>
                      ))}
                    </div>
                  </div>
                  )}
                </CardContent>
              </Card>

              {/* Task List - Content entrance */}
              <Card className="lg:col-span-2 entrance-content">
                <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
                  <span className="label-micro">Checklist</span>
                  <CardTitle className="text-base sm:text-xl">Setup Tasks</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 sm:pt-2 px-1.5 sm:px-4 md:px-6">
                  <TaskAccordion 
                    tasks={tasks}
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
                    isSigningLegal={isSigningLegal}
                    hotelLegalEntity={hotelLegalEntity}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation - Same structure as Portal */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-pb">
        <div className="flex items-center justify-around py-2 px-4">
          {/* Mobile Onboarding Tab */}
          <Button
            variant={activeView === "onboarding" ? "secondary" : "ghost"}
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
            onClick={() => setActiveView("onboarding")}
          >
            <ClipboardList className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Onboarding</span>
          </Button>

          {/* Mobile Documents Tab */}
          <Button
            variant={activeView === "documents" ? "secondary" : "ghost"}
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
            onClick={() => setActiveView("documents")}
          >
            <FileText className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Documents</span>
          </Button>
          
          {/* Mobile Activity Feed Button */}
          <Button
            variant="ghost"
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px] relative"
            onClick={() => setIsActivityFeedOpen(true)}
          >
            <Clock className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Activity</span>
            {demoActivities.length > 1 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                {demoActivities.length > 9 ? "9+" : demoActivities.length}
              </span>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
            onClick={handleSignOut}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Login</span>
          </Button>
        </div>
      </nav>

      {/* Demo Activity Feed Panel */}
      <DemoActivityFeedPanel
        open={isActivityFeedOpen}
        onClose={() => setIsActivityFeedOpen(false)}
        activities={demoActivities}
      />
    </div>
  );
}
