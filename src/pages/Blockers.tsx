import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Clock, Building2, ExternalLink, Bell, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Task step mapping
const TASK_STEPS: Record<string, { letter: string; name: string }> = {
  legal: { letter: "A", name: "Legal & Agreements" },
  brand: { letter: "B", name: "Brand Identity" },
  venue: { letter: "C", name: "Venue Setup" },
  pos: { letter: "D", name: "POS Integration" },
  devices: { letter: "E", name: "Device Setup" },
};

interface MockBlocker {
  id: string;
  hotelName: string;
  reason: string;
  incompleteTask: keyof typeof TASK_STEPS;
  completedTasks: number;
  type: "automatic" | "manual";
  createdAt: Date;
}

const mockBlockers: MockBlocker[] = [
  { 
    id: "1", 
    hotelName: "The Riverside Hotel", 
    reason: "Pilot Agreement not signed - awaiting legal signature",
    incompleteTask: "legal",
    completedTasks: 0,
    type: "automatic",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  { 
    id: "2", 
    hotelName: "Mountain View Lodge", 
    reason: "Brand identity incomplete - missing logo upload",
    incompleteTask: "brand",
    completedTasks: 1,
    type: "automatic",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  { 
    id: "3", 
    hotelName: "Lakefront Inn", 
    reason: "POS integration pending - provider not selected",
    incompleteTask: "pos",
    completedTasks: 3,
    type: "automatic",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export default function Blockers() {
  const navigate = useNavigate();
  const [notifyBlocker, setNotifyBlocker] = useState<MockBlocker | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSendReminder = () => {
    if (!notifyBlocker) return;
    
    setIsSending(true);
    // Simulate sending - in real implementation this would use useSendBlockerNotification
    setTimeout(() => {
      toast.success(`Reminder sent to ${notifyBlocker.hotelName}`);
      setIsSending(false);
      setNotifyBlocker(null);
    }, 800);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Responsive header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Active Blockers</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Incomplete tasks preventing phase transitions</p>
          </div>
          <Badge variant="destructive" className="gap-1.5 self-start sm:self-auto">
            <AlertTriangle className="h-3.5 w-3.5" />
            {mockBlockers.length} Active
          </Badge>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {mockBlockers.map((blocker) => {
            const taskInfo = TASK_STEPS[blocker.incompleteTask];
            const progressPercent = (blocker.completedTasks / 5) * 100;

            return (
              <Card 
                key={blocker.id} 
                className="border-destructive/30 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <span className="truncate">{blocker.hotelName}</span>
                    </CardTitle>
                    
                    {/* Task Step Badge */}
                    <div className="flex items-center gap-2">
                      <div 
                        className={cn(
                          "w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold",
                          "bg-destructive/10 text-destructive border border-destructive/20"
                        )}
                      >
                        {taskInfo.letter}
                      </div>
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        {taskInfo.name}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Blocker Reason */}
                    <div className="flex items-start gap-2 text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0" />
                      <span className="text-xs sm:text-sm">{blocker.reason}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span>Onboarding Progress</span>
                        <span className="font-medium">{blocker.completedTasks}/5 tasks</span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5 sm:h-2" />
                    </div>

                    {/* Footer - stack on mobile */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Created {formatDistanceToNow(blocker.createdAt, { addSuffix: true })}
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Send Reminder Button */}
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 min-h-[44px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNotifyBlocker(blocker);
                                }}
                              >
                                <Bell className="h-4 w-4" />
                                <span className="sm:hidden">Send Reminder</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Send reminder to client</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-1.5 text-primary hover:text-primary min-h-[44px] flex-1 sm:flex-none"
                          onClick={() => navigate("/portal")}
                        >
                          Open in Portal
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Notification Confirmation Dialog */}
      <AlertDialog open={!!notifyBlocker} onOpenChange={(open) => !open && setNotifyBlocker(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send reminder to {notifyBlocker?.hotelName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a notification to the client's activity feed about: <span className="font-medium text-foreground">{notifyBlocker?.reason}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendReminder}
              disabled={isSending}
              className="gap-2"
            >
              {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Reminder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
