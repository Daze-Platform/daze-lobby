import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { StepBadge, type StepBadgeStatus } from "@/components/ui/step-badge";
import { Tablet, Check } from "lucide-react";
import { toast } from "sonner";
import { useLogActivity } from "@/hooks/useLogActivity";
import { useClient } from "@/contexts/ClientContext";

interface DevicesStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  data?: Record<string, unknown>;
  onUpdate: (data: { use_daze_tablets: boolean }) => void;
  isSaving?: boolean;
  onStepComplete?: () => void;
  isJustCompleted?: boolean;
  isUnlocking?: boolean;
}

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
  
  // Initialize from saved data
  const savedRequestingDevices = data?.use_daze_tablets !== undefined 
    ? (data.use_daze_tablets as boolean)
    : null;
  
  const [requestingDevices, setRequestingDevices] = useState<boolean | null>(savedRequestingDevices);
  const [isConfirmed, setIsConfirmed] = useState(savedRequestingDevices !== null);

  // Derive badge status
  const badgeStatus: StepBadgeStatus = isCompleted
    ? "complete"
    : isLocked
      ? "locked"
      : "pending";

  const handleToggleChange = (checked: boolean) => {
    setRequestingDevices(checked);
    setIsConfirmed(false);
    
    logActivity.mutate({
      action: "device_choice_selected",
      details: {
        requesting_devices: checked,
      },
    });
  };

  const handleConfirm = () => {
    if (requestingDevices === null) return;
    
    onUpdate({ use_daze_tablets: requestingDevices });
    setIsConfirmed(true);
    
    logActivity.mutate({
      action: "device_setup_confirmed",
      details: {
        requesting_devices: requestingDevices,
      },
    });
    
    toast.success(
      requestingDevices 
        ? "Device request submitted!"
        : "No devices needed - confirmed!"
    );
    
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
              {isConfirmed && !isCompleted && requestingDevices !== null && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-2xs font-medium bg-primary/10 text-primary">
                  {requestingDevices ? "Requesting Devices" : "No Devices Needed"}
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
        <div className="relative min-h-[200px] sm:min-h-[220px] pt-1 sm:pt-2">
          <AnimatePresence mode="wait">
            {!isConfirmed ? (
              /* Selection UI */
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="space-y-4 sm:space-y-5"
              >
                {/* Question Card */}
                <div className="p-4 sm:p-5 rounded-xl bg-card border">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                      <Tablet className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base">
                        Would you like Daze to provide tablets for your property?
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        We can ship pre-configured tablets ready to deploy, or you can use your existing hardware.
                      </p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="flex items-center justify-center gap-4 mt-5 py-3">
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      requestingDevices === false ? "text-foreground" : "text-muted-foreground"
                    )}>
                      No
                    </span>
                    <Switch
                      checked={requestingDevices === true}
                      onCheckedChange={handleToggleChange}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      requestingDevices === true ? "text-foreground" : "text-muted-foreground"
                    )}>
                      Yes
                    </span>
                  </div>
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleConfirm}
                  disabled={requestingDevices === null || isSaving}
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
                    <Tablet className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {requestingDevices 
                        ? "Devices Requested"
                        : "No Devices Needed"
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {requestingDevices
                        ? "We'll coordinate shipping details with your team"
                        : "Our team will send installation instructions for your existing hardware"
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
