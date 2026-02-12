import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { 
  Warning, 
  Clock, 
  Buildings, 
  ArrowSquareOut, 
  Bell, 
  CircleNotch,
  CheckCircle,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useActiveBlockers, isWatchdogBlocker, getWatchdogSeverity, type ActiveBlocker } from "@/hooks/useActiveBlockers";
import { useSendBlockerNotification } from "@/hooks/useSendBlockerNotification";

// Task step mapping
const TASK_STEPS: Record<string, { letter: string; name: string }> = {
  legal: { letter: "A", name: "Legal & Agreements" },
  brand: { letter: "B", name: "Brand Identity" },
  venue: { letter: "C", name: "Venue Setup" },
  pos: { letter: "D", name: "POS Integration" },
  devices: { letter: "E", name: "Device Setup" },
};

export default function Blockers() {
  const navigate = useNavigate();
  const { data: blockers = [], isLoading } = useActiveBlockers();
  const sendNotification = useSendBlockerNotification();
  const [notifyBlocker, setNotifyBlocker] = useState<ActiveBlocker | null>(null);

  const handleSendReminder = () => {
    if (!notifyBlocker) return;
    sendNotification.mutate(
      {
        clientId: notifyBlocker.clientId,
        blockerReason: notifyBlocker.reason,
      },
      { onSettled: () => setNotifyBlocker(null) },
    );
  };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Active Blockers</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Incomplete tasks preventing phase transitions</p>
          </div>
          <Badge variant="destructive" className="gap-1.5 self-start sm:self-auto">
            <Warning size={14} weight="duotone" />
            {blockers.length} Active
          </Badge>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <CircleNotch size={32} weight="bold" className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && blockers.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <CheckCircle size={48} weight="duotone" className="text-emerald-500" />
              <h2 className="text-lg font-semibold text-foreground">No active blockers</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                All clients are progressing smoothly through onboarding. Blockers will appear here when a client has incomplete tasks preventing phase transitions.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Blocker Cards */}
        <div className="grid gap-3 sm:gap-4">
          {blockers.map((blocker) => {
            const taskInfo = blocker.incompleteTaskKey
              ? TASK_STEPS[blocker.incompleteTaskKey] ?? null
              : null;
            const progressPercent =
              blocker.totalTasks > 0
                ? (blocker.completedTasks / blocker.totalTasks) * 100
                : 0;

            return (
              <Card 
                key={blocker.id} 
                className="border-destructive/30 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      {isWatchdogBlocker(blocker) ? (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "shrink-0 p-1 rounded-md",
                                getWatchdogSeverity(blocker) === "high"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                              )}>
                                <Clock size={18} weight="duotone" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>
                                Time-delay blocker ({getWatchdogSeverity(blocker) === "high" ? "120+ hrs" : "72+ hrs"} inactive)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Buildings size={20} weight="duotone" className="text-primary shrink-0" />
                      )}
                      <span className="truncate">{blocker.clientName}</span>
                    </CardTitle>
                    
                    {taskInfo && (
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
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Blocker Reason */}
                    <div className="flex items-start gap-2 text-destructive">
                      <Warning size={16} weight="duotone" className="mt-0.5 shrink-0" />
                      <span className="text-xs sm:text-sm">{blocker.reason}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span>Onboarding Progress</span>
                        <span className="font-medium">{blocker.completedTasks}/{blocker.totalTasks} tasks</span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5 sm:h-2" />
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                        <Clock size={14} weight="duotone" />
                        Created {formatDistanceToNow(new Date(blocker.createdAt), { addSuffix: true })}
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
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
                                <Bell size={16} weight="duotone" />
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
                          className="gap-1.5 text-primary hover:text-primary min-h-[44px] flex-1 sm:flex-none group/btn"
                          disabled={!blocker.clientSlug}
                          onClick={() => navigate(`/admin/portal/${blocker.clientSlug}`)}
                        >
                          Open in Portal
                          <ArrowSquareOut size={14} weight="duotone" className="transition-transform group-hover/btn:scale-110" />
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
            <AlertDialogTitle>Send reminder to {notifyBlocker?.clientName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a notification to the client's activity feed about: <span className="font-medium text-foreground">{notifyBlocker?.reason}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendReminder}
              disabled={sendNotification.isPending}
              className="gap-2"
            >
              {sendNotification.isPending && <CircleNotch size={16} weight="bold" className="animate-spin" />}
              Send Reminder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
