import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Upload, 
  FileSignature, 
  FileText,
  Palette, 
  Building2,
  AlertTriangle,
  LockOpen,
  Activity,
  Settings,
  Copy,
  Send,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActivityLogs, type ActivityLog } from "@/hooks/useActivityLogs";
import { cn } from "@/lib/utils";

interface ActivityFeedPanelProps {
  open: boolean;
  onClose: () => void;
  hotelId: string | null;
}

// Map action types to icons and colors
export function getActionConfig(action: string): { icon: React.ElementType; color: string; bgColor: string } {
  const configs: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    legal_signed: { icon: FileSignature, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    task_completed: { icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    brand_updated: { icon: Palette, color: "text-primary", bgColor: "bg-primary/10" },
    logo_uploaded: { icon: Upload, color: "text-primary", bgColor: "bg-primary/10" },
    venue_created: { icon: Building2, color: "text-violet-500", bgColor: "bg-violet-500/10" },
    venue_updated: { icon: Building2, color: "text-violet-500", bgColor: "bg-violet-500/10" },
    menu_uploaded: { icon: Upload, color: "text-violet-500", bgColor: "bg-violet-500/10" },
    blocker_created: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10" },
    blocker_force_cleared: { icon: LockOpen, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    // POS integration actions
    pos_provider_selected: { icon: Settings, color: "text-accent-orange", bgColor: "bg-accent-orange/10" },
    pos_instructions_copied: { icon: Copy, color: "text-accent-orange", bgColor: "bg-accent-orange/10" },
    pos_sent_to_it: { icon: Send, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    // Blocker notification from admin
    blocker_notification: { icon: Bell, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    // Admin document actions
    document_uploaded: { icon: Upload, color: "text-primary", bgColor: "bg-primary/10" },
    document_deleted: { icon: FileText, color: "text-destructive", bgColor: "bg-destructive/10" },
    // Deletion actions
    client_deleted: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10" },
    client_restored: { icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    device_deleted: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10" },
  };
  
  return configs[action] || { icon: Activity, color: "text-muted-foreground", bgColor: "bg-muted" };
}

// Format the action into a readable sentence
export function formatAction(log: ActivityLog): { userName: string; actionText: string } {
  const userName = log.profile?.full_name || "Someone";
  const details = log.details as Record<string, unknown> | null;
  
  const actionTexts: Record<string, string> = {
    legal_signed: "signed the Pilot Agreement",
    task_completed: `completed ${(details?.task_name as string) || "a task"}`,
    brand_updated: "updated brand identity",
    logo_uploaded: "uploaded a logo",
    venue_created: `created venue "${(details?.venue_name as string) || "a venue"}"`,
    venue_updated: `updated venue "${(details?.venue_name as string) || "a venue"}"`,
    menu_uploaded: `uploaded menu for ${(details?.venue_name as string) || "a venue"}`,
    blocker_created: `flagged a blocker: ${(details?.reason as string)?.substring(0, 30) || "issue detected"}`,
    blocker_force_cleared: "manually cleared a blocker",
    blocker_notification: `sent a notification: "${(details?.message as string) || (details?.blocker_reason as string) || "Action required"}"`,
    document_uploaded: `uploaded ${(details?.title as string) || "a document"}`,
    document_deleted: `removed ${(details?.title as string) || "a document"}`,
    client_deleted: `deleted client "${(details?.client_name as string) || "a client"}"`,
    client_restored: `restored client "${(details?.client_name as string) || "a client"}"`,
    device_deleted: `deleted device ${(details?.serial_number as string) || "a device"}`,
  };
  
  // Check for custom message in details
  if (details?.message && typeof details.message === "string") {
    return { userName, actionText: details.message.replace(`${userName} `, "").replace(/^Blocker manually cleared by .+$/, "manually cleared a blocker") };
  }
  
  return { 
    userName, 
    actionText: actionTexts[log.action] || log.action.replace(/_/g, " ") 
  };
}

function ActivityItem({ log, index }: { log: ActivityLog; index: number }) {
  const config = getActionConfig(log.action);
  const { userName, actionText } = formatAction(log);
  const Icon = config.icon;
  
  const initials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="relative flex gap-3 pb-6 last:pb-0"
    >
      {/* Timeline connector line */}
      <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border/50 last:hidden" />
      
      {/* Avatar with action icon overlay */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-9 w-9 ring-2 ring-background">
          <AvatarImage src={log.profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* Action icon badge */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-background",
          config.bgColor
        )}>
          <Icon className={cn("h-2.5 w-2.5", config.color)} strokeWidth={2.5} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm leading-snug">
          <span className="font-semibold text-foreground">{userName}</span>
          {" "}
          <span className="text-muted-foreground">{actionText}</span>
        </p>
        <p className="text-2xs text-muted-foreground/70 mt-1">
          {timeAgo}
        </p>
      </div>
    </motion.div>
  );
}

export function ActivityFeedPanel({ open, onClose, hotelId }: ActivityFeedPanelProps) {
  const { data: logs, isLoading } = useActivityLogs(hotelId);
  const prevLogsRef = useRef<ActivityLog[]>([]);

  // Track new items for animation
  useEffect(() => {
    if (logs) {
      prevLogsRef.current = logs;
    }
  }, [logs]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/20"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ 
              type: "tween",
              duration: 0.3,
              ease: [0.32, 0.72, 0, 1] // Premium cubic-bezier
            }}
            className={cn(
              "fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[90vw]",
              "bg-white/80 dark:bg-card/80 backdrop-blur-xl",
              "border-l border-white/20 dark:border-border/50",
              "shadow-2xl shadow-slate-900/10"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Activity Feed</h2>
                  <p className="text-2xs text-muted-foreground">Recent updates</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(100%-65px)]">
              <div className="p-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : logs && logs.length > 0 ? (
                  <div className="relative">
                    <AnimatePresence mode="popLayout">
                      {logs.map((log, index) => (
                        <ActivityItem key={log.id} log={log} index={index} />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                      <Activity className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                    <p className="text-2xs text-muted-foreground/70 mt-1">
                      Actions will appear here as your team works
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
