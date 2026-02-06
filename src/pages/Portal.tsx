import { useAuthContext } from "@/contexts/AuthContext";
import { useClientPortal } from "@/hooks/useClientPortal";
import { ProgressRing } from "@/components/portal/ProgressRing";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { TaskAccordion } from "@/components/portal/TaskAccordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import dazeLogo from "@/assets/daze-logo.png";

export default function Portal() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { 
    hotel, 
    tasks, 
    isLoading, 
    progress, 
    status, 
    updateTask, 
    uploadFile 
  } = useClientPortal();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleTaskUpdate = (taskKey: string, data: Record<string, unknown>) => {
    updateTask({ taskKey, data });
  };

  const handleFileUpload = (taskKey: string, file: File, fieldName: string) => {
    uploadFile({ taskKey, file, fieldName });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Format tasks for the accordion
  const formattedTasks = tasks.length > 0 
    ? tasks.map(t => ({
        key: t.task_key,
        name: t.task_name,
        isCompleted: t.is_completed,
        data: t.data as Record<string, unknown>,
      }))
    : [
        { key: "legal", name: "Legal & Agreement", isCompleted: false, data: {} },
        { key: "brand", name: "Brand Identity", isCompleted: false, data: {} },
        { key: "menu", name: "Menu Configuration", isCompleted: false, data: {} },
      ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dazeLogo} alt="Daze" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-4">
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
                onTaskUpdate={handleTaskUpdate}
                onFileUpload={handleFileUpload}
              />
            </CardContent>
          </Card>
        </div>

        {/* No Hotel Assigned State */}
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
