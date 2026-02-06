import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { AlertTriangle, Lightbulb, LockOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClearBlocker } from "@/hooks/useClearBlocker";
import type { Enums } from "@/integrations/supabase/types";

export interface BlockerData {
  id: string;
  reason: string;
  blockerType: Enums<"blocker_type">;
  autoRule: string | null;
  createdAt: string;
  hotelId: string;
  hotelName: string;
  hotelPhase: string;
}

interface BlockerResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocker: BlockerData | null;
  onBlockerCleared?: () => void;
}

// Parse a human-readable issue title from auto_rule or fallback to reason
function parseIssueTitle(autoRule: string | null, reason: string): string {
  if (autoRule) {
    const titles: Record<string, string> = {
      low_order_volume: "Low Order Volume",
      missing_legal: "Missing Legal Signature",
      device_offline: "Device Offline",
      stale_onboarding: "Stale Onboarding",
    };
    return titles[autoRule] || autoRule.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
  // Extract first few words from reason as fallback
  return reason.split(" ").slice(0, 4).join(" ");
}

// Get context-aware action button config based on auto_rule
function getActionConfig(autoRule: string | null): { label: string; path: string | null } {
  const actions: Record<string, { label: string; path: string | null }> = {
    low_order_volume: { label: "View Activity Log", path: null }, // Opens detail panel
    missing_legal: { label: "Open Pilot Agreement", path: "/portal" },
    device_offline: { label: "View Device Status", path: null },
    stale_onboarding: { label: "Resume Onboarding", path: "/portal" },
  };
  return actions[autoRule || ""] || { label: "View Details", path: null };
}

// Get a contextual "why this matters" note based on auto_rule
function getDazeNote(autoRule: string | null, hotelPhase: string): string {
  const notes: Record<string, string> = {
    low_order_volume: "Resolving this allows the hotel to maintain healthy operational metrics and continue progressing.",
    missing_legal: "Signing the pilot agreement is required before we can proceed to the Pilot Live stage.",
    device_offline: "Reconnecting devices ensures accurate order tracking and seamless guest experiences.",
    stale_onboarding: "Completing onboarding unlocks the next phase and brings the property closer to launch.",
  };
  return notes[autoRule || ""] || `Resolving this blocker will help move ${hotelPhase === "onboarding" ? "onboarding" : "this hotel"} forward.`;
}

export function BlockerResolutionModal({
  open,
  onOpenChange,
  blocker,
  onBlockerCleared,
}: BlockerResolutionModalProps) {
  const navigate = useNavigate();
  const clearBlocker = useClearBlocker();
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  if (!blocker) return null;

  const daysStalled = differenceInDays(new Date(), new Date(blocker.createdAt));
  const issueTitle = parseIssueTitle(blocker.autoRule, blocker.reason);
  const actionConfig = getActionConfig(blocker.autoRule);
  const dazeNote = getDazeNote(blocker.autoRule, blocker.hotelPhase);

  const handlePrimaryAction = () => {
    if (actionConfig.path) {
      navigate(actionConfig.path);
    }
    // TODO: For non-navigation actions, could open a detail panel
    onOpenChange(false);
  };

  const handleForceClear = async () => {
    setShowForceConfirm(false);
    
    await clearBlocker.mutateAsync({
      blockerId: blocker.id,
      hotelId: blocker.hotelId,
      hotelName: blocker.hotelName,
    });
    
    onBlockerCleared?.();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "sm:max-w-md p-0 overflow-hidden",
            "border-t-2 border-t-[hsl(24,94%,53%)]", // Sunset Orange top border
            "animate-modal-enter"
          )}
        >
          {/* Header */}
          <DialogHeader className="p-5 pb-4 space-y-3">
            <div className="flex items-start gap-3">
              {/* Pulsing Alert Icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 animate-blocker-pulse rounded-full" />
                <div className="relative w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Blocker Detected: {issueTitle}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{blocker.hotelName}</span>
                  {" "}has been stalled for{" "}
                  <span className="font-semibold text-destructive">{daysStalled} day{daysStalled !== 1 ? "s" : ""}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="px-5 pb-5 space-y-4">
            {/* The Issue */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                The Issue
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {blocker.reason}
              </p>
            </div>

            {/* Daze Note */}
            <div className="bg-[hsl(199,89%,48%)]/5 border border-[hsl(199,89%,48%)]/20 rounded-lg p-3">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="h-4 w-4 text-[hsl(199,89%,48%)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(199,89%,48%)] mb-1">
                    Daze Note
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {dazeNote}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handlePrimaryAction}
                className="flex-1 bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,43%)] text-white"
              >
                {actionConfig.label}
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </Button>
            </div>

            {/* Force Clear Separator */}
            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center pt-2">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-2 text-2xs text-muted-foreground uppercase tracking-wider">
                  Override
                </span>
              </div>
            </div>

            {/* Force Clear Button */}
            <Button
              variant="ghost"
              onClick={() => setShowForceConfirm(true)}
              disabled={clearBlocker.isPending}
              className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2"
            >
              <LockOpen className="h-4 w-4" />
              Force Clear Blocker
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Force Clear Confirmation Dialog */}
      <AlertDialog open={showForceConfirm} onOpenChange={setShowForceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Clear Blocker?</AlertDialogTitle>
            <AlertDialogDescription>
              Manually clearing this blocker will allow the hotel to move to the next stage. 
              This action will be logged in the activity feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceClear}
              className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,43%)] text-white"
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
