import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
import { ConfettiCelebration } from "@/components/portal/ConfettiCelebration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import dazeLogo from "@/assets/daze-logo.png";
import { toast } from "sonner";
import type { Venue } from "@/components/portal/VenueCard";

/**
 * Preview/Demo version of the Client Portal V2
 * This is for testing the UI without authentication
 */
export default function PortalPreview() {
  const [status, setStatus] = useState<"onboarding" | "reviewing" | "live">("onboarding");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isSigningLegal, setIsSigningLegal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevStatus = useRef(status);
  
  // Demo legal entity state
  const [hotelLegalEntity, setHotelLegalEntity] = useState({
    legal_entity_name: "",
    billing_address: "",
    authorized_signer_name: "",
    authorized_signer_title: "",
  });

  const [tasks, setTasks] = useState([
    { key: "legal", name: "Legal & Agreements", isCompleted: false, data: {} as Record<string, unknown> },
    { key: "brand", name: "Brand Identity", isCompleted: false, data: {} as Record<string, unknown> },
    { key: "venue", name: "Venue Manager", isCompleted: false, data: {} as Record<string, unknown> },
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
    legal_entity_name?: string;
    billing_address?: string;
    authorized_signer_name?: string;
    authorized_signer_title?: string;
  }) => {
    setIsSigningLegal(true);
    
    // Update demo legal entity state
    setHotelLegalEntity({
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
    
    setIsSigningLegal(false);
    toast.success("Agreement signed successfully! Next step unlocked. (Demo mode)");
  };

  const handleTaskUpdate = (taskKey: string, data: Record<string, unknown>) => {
    setTasks(prev => prev.map(task => 
      task.key === taskKey 
        ? { ...task, isCompleted: true, data: { ...task.data, ...data } }
        : task
    ));
    toast.success(`Task completed! (Demo mode)`);
  };

  const handleFileUpload = (taskKey: string, file: File, fieldName: string) => {
    toast.success(`File "${file.name}" uploaded. (Demo mode)`);
  };

  const handleVenuesSave = () => {
    if (venues.length > 0 && venues.some(v => v.name.trim())) {
      setTasks(prev => prev.map(task =>
        task.key === "venue"
          ? { ...task, isCompleted: true, data: { venues: venues.map(v => v.name) } }
          : task
      ));
      toast.success("Venues saved! (Demo mode)");
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 dark:bg-background">
      {/* Glass Header - Frosted canopy */}
      <header className="glass-header entrance-header">
        <div className="container mx-auto px-6 md:px-10 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={dazeLogo} alt="Daze" className="h-10 w-auto" />
            <span className="label-micro bg-warning/10 text-warning px-3 py-1.5 rounded-full">
              Preview Mode
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Welcome Section - Hero entrance */}
        <div className="mb-12 entrance-hero">
          <span className="label-micro mb-2 block">Welcome Back</span>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
            Grand Hyatt Demo
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
              
              {/* Demo Status Toggle */}
              <div className="w-full pt-6 border-t border-border/20">
                <p className="label-micro mb-3 text-center">Demo: Toggle Status</p>
                <div className="flex gap-2">
                  {(["onboarding", "reviewing", "live"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={status === s ? "default" : "secondary"}
                      onClick={() => setStatus(s)}
                      className="flex-1 text-xs capitalize"
                    >
                      {s === "reviewing" ? "in-progress" : s}
                    </Button>
                  ))}
                </div>
              </div>
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
      </main>
    </div>
  );
}
