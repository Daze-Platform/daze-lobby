import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Upload, 
  FileSignature, 
  Palette, 
  Building2,
  Activity,
  Settings,
  Copy,
  Send,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface DemoActivity {
  id: string;
  action: string;
  userName: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

interface DemoActivityFeedPanelProps {
  open: boolean;
  onClose: () => void;
  activities: DemoActivity[];
}

// Map action types to icons and colors
function getActionConfig(action: string): { icon: React.ElementType; color: string; bgColor: string } {
  const configs: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    legal_signed: { icon: FileSignature, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    task_completed: { icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    brand_updated: { icon: Palette, color: "text-primary", bgColor: "bg-primary/10" },
    logo_uploaded: { icon: Upload, color: "text-primary", bgColor: "bg-primary/10" },
    venue_created: { icon: Building2, color: "text-violet-500", bgColor: "bg-violet-500/10" },
    venue_updated: { icon: Building2, color: "text-violet-500", bgColor: "bg-violet-500/10" },
    menu_uploaded: { icon: Upload, color: "text-violet-500", bgColor: "bg-violet-500/10" },
    pos_provider_selected: { icon: Settings, color: "text-accent-orange", bgColor: "bg-accent-orange/10" },
    pos_instructions_copied: { icon: Copy, color: "text-accent-orange", bgColor: "bg-accent-orange/10" },
    pos_sent_to_it: { icon: Send, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    welcome: { icon: Sparkles, color: "text-primary", bgColor: "bg-primary/10" },
  };
  
  return configs[action] || { icon: Activity, color: "text-muted-foreground", bgColor: "bg-muted" };
}

// Format the action into a readable sentence
function formatAction(activity: DemoActivity): { userName: string; actionText: string } {
  const { userName, action, details } = activity;
  
  const actionTexts: Record<string, string> = {
    legal_signed: `signed the Pilot Agreement as "${(details?.signer_name as string) || "Authorized Signer"}"`,
    task_completed: `completed ${(details?.task_name as string) || "a task"}`,
    brand_updated: "updated brand identity",
    logo_uploaded: `uploaded "${(details?.file_name as string) || "a logo"}"`,
    venue_created: `created venue "${(details?.venue_name as string) || "a venue"}"`,
    venue_updated: `saved ${(details?.venue_count as number) || 1} venue(s)`,
    menu_uploaded: `uploaded menu for ${(details?.venue_name as string) || "a venue"}`,
    pos_provider_selected: `selected ${(details?.provider as string) || "a POS provider"}`,
    welcome: "started onboarding session",
  };
  
  return { 
    userName, 
    actionText: actionTexts[action] || action.replace(/_/g, " ") 
  };
}

function DemoActivityItem({ activity, index }: { activity: DemoActivity; index: number }) {
  const config = getActionConfig(activity.action);
  const { userName, actionText } = formatAction(activity);
  const Icon = config.icon;
  
  const initials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const timeAgo = formatDistanceToNow(activity.timestamp, { addSuffix: true });

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

export function DemoActivityFeedPanel({ open, onClose, activities }: DemoActivityFeedPanelProps) {
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
              ease: [0.32, 0.72, 0, 1]
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
                  <p className="text-2xs text-muted-foreground">Session updates</p>
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
                {activities.length > 0 ? (
                  <div className="relative">
                    <AnimatePresence mode="popLayout">
                      {activities.map((activity, index) => (
                        <DemoActivityItem key={activity.id} activity={activity} index={index} />
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
                      Complete tasks to see your progress here
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
