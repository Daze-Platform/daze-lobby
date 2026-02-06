import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { VenueManager } from "../VenueManager";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { StepBadge, type StepBadgeStatus } from "@/components/ui/step-badge";
import type { Venue } from "../VenueCard";

interface VenueStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  isActive?: boolean;
  data?: Record<string, unknown>;
  venues: Venue[];
  onVenuesChange: (venues: Venue[]) => void;
  onSave: () => Promise<void> | void;
  isSaving?: boolean;
  onStepComplete?: () => void;
  isJustCompleted?: boolean;
  isUnlocking?: boolean;
}

export function VenueStep({ 
  isCompleted, 
  isLocked,
  isActive = false,
  data, 
  venues,
  onVenuesChange,
  onSave,
  isSaving,
  onStepComplete,
  isJustCompleted,
  isUnlocking
}: VenueStepProps) {

  // Derive badge status
  const badgeStatus: StepBadgeStatus = isCompleted 
    ? "complete" 
    : isLocked 
      ? "locked" 
      : isActive 
        ? "active" 
        : "pending";
  return (
    <AccordionItem 
      value="venue" 
      className={cn(
        "px-5 relative overflow-hidden transition-all duration-300 border-0",
        isLocked && "opacity-50 pointer-events-none",
        isUnlocking && "animate-unlock-glow"
      )}
      disabled={isLocked}
    >
      <StepCompletionEffect isActive={isJustCompleted || false} />
      <AccordionTrigger className="hover:no-underline py-3 md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          <StepBadge 
            step="C" 
            status={badgeStatus} 
            isJustCompleted={isJustCompleted} 
          />
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm md:text-base truncate">Venue Manager</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">Add venues and upload menus for each location</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="pt-2">
          <VenueManager
            venues={venues}
            onVenuesChange={onVenuesChange}
            onSave={onSave}
            isSaving={isSaving}
            onStepComplete={onStepComplete}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
