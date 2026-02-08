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
  onAddVenue: () => Promise<Venue | undefined>;
  onUpdateVenue: (id: string, updates: { name?: string; menuPdfUrl?: string }) => Promise<void>;
  onRemoveVenue: (id: string) => Promise<void>;
  onUploadMenu: (venueId: string, venueName: string, file: File) => Promise<void>;
  onCompleteStep: () => Promise<void>;
  isAdding?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
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
  onAddVenue,
  onUpdateVenue,
  onRemoveVenue,
  onUploadMenu,
  onCompleteStep,
  isAdding,
  isUpdating,
  isDeleting,
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

  const handleCompleteStep = async () => {
    await onCompleteStep();
    onStepComplete?.();
  };

  return (
    <AccordionItem 
      value="venue" 
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
            step="C" 
            status={badgeStatus} 
            isJustCompleted={isJustCompleted} 
          />
          <div className="text-left min-w-0">
            <p className="font-semibold text-xs sm:text-sm md:text-base truncate">Venue Manager</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Add venues and upload menus</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3 sm:pb-4">
        <div className="pt-1 sm:pt-2">
          <VenueManager
            venues={venues}
            onAddVenue={onAddVenue}
            onUpdateVenue={onUpdateVenue}
            onRemoveVenue={onRemoveVenue}
            onUploadMenu={onUploadMenu}
            onCompleteStep={handleCompleteStep}
            isAdding={isAdding}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
