import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
import { ConfettiCelebration } from "@/components/portal/ConfettiCelebration";
import { WelcomeTour } from "@/components/portal/WelcomeTour";
import { DemoActivityFeedPanel, type DemoActivity, type PortalView } from "@/components/portal";
import { DemoPortalDocuments } from "@/components/portal/DemoPortalDocuments";
import { useWelcomeTour } from "@/hooks/useWelcomeTour";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RotateCcw, Clock, ClipboardList, FileText } from "lucide-react";
import dazeLogo from "@/assets/daze-logo.png";
import { toast } from "sonner";
import type { Venue } from "@/components/portal/VenueCard";
import { signOut } from "@/lib/auth";
/**
 * Preview/Demo version of the Client Portal V2
 * This is for testing the UI without authentication
 */
export default function PortalPreview() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<PortalView>("onboarding");
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
      action: "welcome",
      userName: "Demo User",
      timestamp: new Date(),
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
  
  // Welcome tour - using "preview" as the user ID for demo
  const { showTour, completeTour, resetTour } = useWelcomeTour("preview-user");
  
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

  const handleVenuesSave = () => {
    if (venues.length > 0 && venues.some(v => v.name.trim())) {
      setTasks(prev => prev.map(task =>
        task.key === "venue"
          ? { ...task, isCompleted: true, data: { venues: venues.map(v => v.name) } }
          : task
      ));
      
      // Log demo activity
      logDemoActivity("venue_updated", { venue_count: venues.filter(v => v.name.trim()).length });
      toast.success("Venues saved! (Demo mode)");
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 dark:bg-background pb-24 sm:pb-20 md:pb-0">
      {/* Welcome Tour */}
      {showTour && (
        <WelcomeTour onComplete={completeTour} />
      )}

      {/* Glass Header - Frosted canopy */}
      <header className="glass-header entrance-header">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 flex items-center justify-between">
          {/* Mobile: Center logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <img src={dazeLogo} alt="Daze" className="h-8 sm:h-10 w-auto" />
            <span className="label-micro bg-warning/10 text-warning px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs">
              Preview
            </span>
          </div>
          {/* Desktop nav buttons - hidden on mobile */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            {/* View Tabs */}
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as PortalView)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="onboarding" className="gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Onboarding
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground min-h-[44px]"
              onClick={() => {
                resetTour();
                toast.info("Welcome tour reset!");
              }}
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
              Reset Tour
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full relative"
              onClick={() => setIsActivityFeedOpen(true)}
            >
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              {demoActivities.length > 1 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                  {demoActivities.length > 9 ? "9+" : demoActivities.length}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 min-h-[44px]"
              onClick={() => {
                navigate("/auth?force=1");
                void signOut().catch(() => {});
              }}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Back to Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8 lg:py-12">
        {activeView === "documents" ? (
          <DemoPortalDocuments />
        ) : (
          <>
            {/* Welcome Section - Hero entrance */}
            <div className="mb-4 sm:mb-8 lg:mb-12 entrance-hero">
              <span className="label-micro mb-1 sm:mb-2 block">Welcome Back</span>
              <h1 className="font-display text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-1 sm:mb-3">
                Grand Hyatt Demo
              </h1>
              <p className="text-xs sm:text-base lg:text-lg text-muted-foreground">
                Complete the steps below to get your hotel ready for launch.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-6 lg:gap-8 lg:grid-cols-3">
              {/* Hero Section - Progress */}
              <Card className="lg:col-span-1 entrance-hero">
                <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
                  <span className="label-micro">Progress</span>
                  <CardTitle className="text-base sm:text-xl">Onboarding</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 sm:gap-6 pt-0 sm:pt-2 px-3 sm:px-6 pb-4">
                  {/* Responsive Progress Ring - smaller on mobile */}
                  <div className="w-full flex justify-center">
                    <ProgressRing progress={progress} status={status} size={140} className="sm:hidden" />
                    <ProgressRing progress={progress} status={status} size={160} className="hidden sm:block" />
                  </div>
                  <StatusBadge status={status} />
                  <ConfettiCelebration 
                    trigger={showConfetti} 
                    onComplete={() => setShowConfetti(false)} 
                  />
                  
                  {/* Demo Status Toggle - Horizontal scroll on mobile */}
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
                    onVenuesChange={setVenues}
                    onVenuesSave={handleVenuesSave}
                    isSigningLegal={isSigningLegal}
                    hotelLegalEntity={hotelLegalEntity}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-pb">
        <div className="flex items-center justify-around py-2 px-4">
          <Button
            variant={activeView === "onboarding" ? "default" : "ghost"}
            size="sm"
            className="flex-col gap-1 h-auto py-2 min-h-[56px] min-w-[64px]"
            onClick={() => setActiveView("onboarding")}
          >
            <ClipboardList className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px]">Onboarding</span>
          </Button>
          <Button
            variant={activeView === "documents" ? "default" : "ghost"}
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
            onClick={() => {
              navigate("/auth?force=1");
              void signOut().catch(() => {});
            }}
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
