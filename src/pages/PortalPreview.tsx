import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
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
  const [tasks, setTasks] = useState([
    { key: "legal", name: "Legal & Agreements", isCompleted: false, data: {} as Record<string, unknown> },
    { key: "brand", name: "Brand Identity", isCompleted: false, data: {} as Record<string, unknown> },
    { key: "venue", name: "Venue Manager", isCompleted: false, data: {} as Record<string, unknown> },
  ]);

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

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

  const handleLegalSign = async (signatureDataUrl: string) => {
    setIsSigningLegal(true);
    
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
    <div className="min-h-screen bg-background">
      {/* Header - refined, borderless */}
      <header className="bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dazeLogo} alt="Daze" className="h-[57px] w-auto" />
            <span className="text-xs bg-warning/10 text-warning px-3 py-1 rounded-full font-medium">
              PREVIEW MODE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        {/* Welcome Section - refined typography */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome, Grand Hyatt Demo
          </h1>
          <p className="text-muted-foreground">
            Complete the steps below to get your hotel ready for launch.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Hero Section - Progress */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Onboarding Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <ProgressRing progress={progress} />
              <StatusBadge status={status} />
              
              {/* Demo Status Toggle */}
              <div className="w-full pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-3 text-center">Demo: Toggle Status</p>
                <div className="flex gap-2">
                  {(["onboarding", "reviewing", "live"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={status === s ? "default" : "outline"}
                      onClick={() => setStatus(s)}
                      className="flex-1 text-xs capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Setup Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskAccordion 
                tasks={tasks}
                onLegalSign={handleLegalSign}
                onTaskUpdate={handleTaskUpdate}
                onFileUpload={handleFileUpload}
                venues={venues}
                onVenuesChange={setVenues}
                onVenuesSave={handleVenuesSave}
                isSigningLegal={isSigningLegal}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
