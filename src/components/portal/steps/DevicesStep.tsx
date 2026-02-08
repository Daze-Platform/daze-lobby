import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { StepBadge, type StepBadgeStatus } from "@/components/ui/step-badge";
import { Tablet, Monitor, Check, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLogActivity } from "@/hooks/useLogActivity";
import { useClient } from "@/contexts/ClientContext";

interface DevicesStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  data?: Record<string, unknown>;
  onUpdate: (data: { use_daze_tablets: boolean; tablet_count?: number }) => void;
  isSaving?: boolean;
  onStepComplete?: () => void;
  isJustCompleted?: boolean;
  isUnlocking?: boolean;
}

type DeviceChoice = "daze" | "own" | null;

export function DevicesStep({
  isCompleted,
  isLocked,
  data,
  onUpdate,
  isSaving,
  onStepComplete,
  isJustCompleted,
  isUnlocking
}: DevicesStepProps) {
  const { clientId } = useClient();
  const logActivity = useLogActivity(clientId);
  
  const savedChoice = data?.use_daze_tablets !== undefined 
    ? (data.use_daze_tablets ? "daze" : "own") as DeviceChoice
    : null;
  const savedTabletCount = (data?.tablet_count as number) || 2;
  
  const [selectedChoice, setSelectedChoice] = useState<DeviceChoice>(savedChoice);
  const [tabletCount, setTabletCount] = useState(savedTabletCount);
  const [isConfirmed, setIsConfirmed] = useState(!!savedChoice);

  // Derive badge status
  const badgeStatus: StepBadgeStatus = isCompleted
    ? "complete"
    : isLocked
      ? "locked"
      : "pending";

  const handleChoiceSelect = (choice: DeviceChoice) => {
    setSelectedChoice(choice);
    setIsConfirmed(false);
    
    // Log activity
    if (choice) {
      logActivity.mutate({
        action: "device_choice_selected",
        details: {
          choice: choice === "daze" ? "Daze Tablets" : "Own Devices",
        },
      });
    }
  };

  const handleTabletCountChange = (delta: number) => {
    setTabletCount(prev => Math.max(1, Math.min(20, prev + delta)));
  };

  const handleConfirm = () => {
    if (!selectedChoice) return;
    
    const useDazeTablets = selectedChoice === "daze";
    const updateData = useDazeTablets 
      ? { use_daze_tablets: true, tablet_count: tabletCount }
      : { use_daze_tablets: false };
    
    onUpdate(updateData);
    setIsConfirmed(true);
    
    // Log activity
    logActivity.mutate({
      action: "device_setup_confirmed",
      details: {
        use_daze_tablets: useDazeTablets,
        tablet_count: useDazeTablets ? tabletCount : undefined,
      },
    });
    
    toast.success(
      useDazeTablets 
        ? `${tabletCount} Daze tablet${tabletCount > 1 ? "s" : ""} requested!`
        : "Using your own devices confirmed!"
    );
    
    // Trigger step completion
    if (onStepComplete) {
      onStepComplete();
    }
  };

  const handleEdit = () => {
    setIsConfirmed(false);
  };

  return (
    <AccordionItem
      value="devices"
      className={cn(
        "px-3 sm:px-5 relative overflow-hidden transition-all duration-300 border-0",
        isLocked && "opacity-50 pointer-events-none",
        isUnlocking && "animate-unlock-glow"
      )}
      disabled={isLocked}
    >
      <StepCompletionEffect isActive={isJustCompleted || false} />
      <AccordionTrigger className="hover:no-underline py-2.5 md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          <StepBadge
            step="E"
            status={badgeStatus}
            isJustCompleted={isJustCompleted}
          />
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-xs sm:text-sm md:text-base truncate">Device Setup</p>
              {isConfirmed && !isCompleted && selectedChoice && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-2xs font-medium bg-primary/10 text-primary">
                  {selectedChoice === "daze" ? `${tabletCount} Tablets` : "Own Devices"}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">
              Choose your hardware preference
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3 sm:pb-4">
        <div className="relative min-h-[260px] sm:min-h-[280px] pt-1 sm:pt-2">
          <AnimatePresence mode="wait">
            {!isConfirmed ? (
              /* Selection UI */
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="space-y-3 sm:space-y-4"
              >
                <p className="text-xs sm:text-sm text-muted-foreground">
                  How would you like to display the ordering system?
                </p>
                
                {/* Device Choice Cards */}
                <div className="grid gap-2 sm:gap-3">
                  {/* Daze Tablets Option */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoiceSelect("daze")}
                    className={cn(
                      "relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl text-left",
                      "bg-card border-2 transition-all duration-200",
                      "hover:shadow-soft-md hover:-translate-y-0.5",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      selectedChoice === "daze"
                        ? "border-primary shadow-soft-md"
                        : "border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
                      "bg-primary/10"
                    )}>
                      <Tablet className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm">Use Daze Tablets</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        We'll ship pre-configured tablets ready to deploy
                      </p>
                    </div>
                    {/* Selection indicator */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                      selectedChoice === "daze"
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}>
                      {selectedChoice === "daze" && (
                        <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                      )}
                    </div>
                  </motion.button>

                  {/* Own Devices Option */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoiceSelect("own")}
                    className={cn(
                      "relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl text-left",
                      "bg-card border-2 transition-all duration-200",
                      "hover:shadow-soft-md hover:-translate-y-0.5",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      selectedChoice === "own"
                        ? "border-primary shadow-soft-md"
                        : "border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
                      "bg-muted"
                    )}>
                      <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm">Use Our Own Devices</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        We'll use existing tablets or kiosks at the property
                      </p>
                    </div>
                    {/* Selection indicator */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                      selectedChoice === "own"
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}>
                      {selectedChoice === "own" && (
                        <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                      )}
                    </div>
                  </motion.button>
                </div>

                {/* Tablet Count Input (only if Daze tablets selected) */}
                <AnimatePresence>
                  {selectedChoice === "daze" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-3">
                        <label className="text-sm font-medium">
                          How many tablets do you need?
                        </label>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full shrink-0"
                            onClick={() => handleTabletCountChange(-1)}
                            disabled={tabletCount <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={tabletCount}
                            onChange={(e) => setTabletCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                            className="w-20 text-center text-lg font-semibold"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full shrink-0"
                            onClick={() => handleTabletCountChange(1)}
                            disabled={tabletCount >= 20}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">tablets</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirm Button */}
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedChoice || isSaving}
                  className="w-full rounded-full min-h-[44px] bg-primary hover:bg-primary/90"
                >
                  Confirm Selection
                </Button>
              </motion.div>
            ) : (
              /* Confirmed State */
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {selectedChoice === "daze" ? (
                      <Tablet className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    ) : (
                      <Monitor className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {selectedChoice === "daze" 
                        ? `${tabletCount} Daze Tablet${tabletCount > 1 ? "s" : ""}`
                        : "Using Your Own Devices"
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedChoice === "daze"
                        ? "We'll coordinate shipping details with your team"
                        : "Our team will send installation instructions"
                      }
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="w-full rounded-full min-h-[44px]"
                >
                  Change Selection
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
