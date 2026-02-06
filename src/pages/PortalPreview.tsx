import { useState } from "react";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dazeLogo from "@/assets/daze-logo.png";
import { toast } from "sonner";

/**
 * Preview/Demo version of the Client Portal
 * This is for testing the UI without authentication
 */
export default function PortalPreview() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(33);
  const [status, setStatus] = useState<"onboarding" | "reviewing" | "live">("onboarding");
  const [tasks, setTasks] = useState([
    { key: "legal", name: "Legal & Agreement", isCompleted: true, data: {} },
    { key: "brand", name: "Brand Identity", isCompleted: false, data: {} },
    { key: "menu", name: "Menu Configuration", isCompleted: false, data: {} },
  ]);

  const handleTaskUpdate = (taskKey: string, data: Record<string, unknown>) => {
    setTasks(prev => prev.map(t => 
      t.key === taskKey 
        ? { ...t, isCompleted: true, data } 
        : t
    ));
    const newProgress = Math.round(((tasks.filter(t => t.isCompleted).length + 1) / tasks.length) * 100);
    setProgress(newProgress);
    toast.success(`Task "${taskKey}" completed! (Demo mode)`);
  };

  const handleFileUpload = (taskKey: string, file: File, fieldName: string) => {
    toast.success(`File "${file.name}" uploaded for ${taskKey}. (Demo mode - not actually saved)`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dazeLogo} alt="Daze" className="h-8 w-auto" />
            <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-medium">
              PREVIEW MODE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, Grand Hyatt Demo
          </h1>
          <p className="text-muted-foreground">
            Complete the steps below to get your hotel ready for launch.
          </p>
        </div>

        {/* Status Toggle for Testing */}
        <div className="mb-6 p-4 border border-dashed rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">Test Status Toggle:</p>
          <div className="flex gap-2">
            <Button 
              variant={status === "onboarding" ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatus("onboarding")}
            >
              Onboarding
            </Button>
            <Button 
              variant={status === "reviewing" ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatus("reviewing")}
            >
              Reviewing
            </Button>
            <Button 
              variant={status === "live" ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatus("live")}
            >
              Live
            </Button>
          </div>
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
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
                onFileUpload={handleFileUpload}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
