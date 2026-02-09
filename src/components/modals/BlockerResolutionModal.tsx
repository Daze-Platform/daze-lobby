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
  clientId: string;
  clientName: string;
  clientPhase: string;
}

interface BlockerResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocker: BlockerData | null;
  onBlockerCleared?: () => void;
}

// Task-based auto_rule values
const TASK_RULES: Record<string, string> = {
  incomplete_legal: "Legal Agreement Pending",
  incomplete_brand: "Brand Identity Incomplete",
  incomplete_venue: "Venue Setup Required",
  incomplete_pos: "POS Integration Pending",
  incomplete_devices: "Device Setup Required",
};

// Parse a human-readable issue title from auto_rule or fallback to reason
function parseIssueTitle(autoRule: string | null, reason: string): string {
  if (autoRule && TASK_RULES[autoRule]) {
    return TASK_RULES[autoRule];
  }
  if (autoRule) {
    return autoRule.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
  // Extract first few words from reason as fallback
  return reason.split(" ").slice(0, 4).join(" ");
}

// Get context-aware action button config based on auto_rule
function getActionConfig(autoRule: string | null): { label: string; path: string } {
  const actions: Record<string, { label: string; path: string }> = {
    incomplete_legal: { label: "Open Pilot Agreement", path: "/portal" },
    incomplete_brand: { label: "Complete Brand Setup", path: "/portal" },
    incomplete_venue: { label: "Configure Venues", path: "/portal" },
    incomplete_pos: { label: "Set Up POS", path: "/portal" },
    incomplete_devices: { label: "Choose Devices", path: "/portal" },
  };
  return actions[autoRule || ""] || { label: "Open Portal", path: "/portal" };
}

// Get a contextual "why this matters" note based on auto_rule
function getDazeNote(autoRule: string | null, _hotelPhase: string): string {
  const notes: Record<string, string> = {
    incomplete_legal: "The pilot agreement must be signed before we can proceed to the next phase.",
    incomplete_brand: "Brand assets help us configure the guest-facing experience.",
    incomplete_venue: "Venue details are required for menu and ordering setup.",
    incomplete_pos: "POS integration enables real-time order syncing.",
    incomplete_devices: "Device selection determines hardware requirements for launch.",
  };
  return notes[autoRule || ""] || "Completing this task unlocks the next phase.";
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
  const dazeNote = getDazeNote(blocker.autoRule, blocker.clientPhase);

  const handlePrimaryAction = () => {
    if (actionConfig.path) {
      navigate(actionConfig.path);
    }
    // Close the modal and navigate to the relevant portal page
    onOpenChange(false);
  };

  const handleForceClear = async () => {
    setShowForceConfirm(false);
    
    await clearBlocker.mutateAsync({
      blockerId: blocker.id,
      clientId: blocker.clientId,
      clientName: blocker.clientName,
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
                  <span className="font-medium text-foreground">{blocker.clientName}</span>
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
