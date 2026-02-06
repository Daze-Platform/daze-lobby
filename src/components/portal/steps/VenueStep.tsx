import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { VenueManager } from "../VenueManager";
import { StepCompletionEffect } from "../StepCompletionEffect";
import type { Venue } from "../VenueCard";

interface VenueStepProps {
  isCompleted: boolean;
  isLocked: boolean;
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
  data, 
  venues,
  onVenuesChange,
  onSave,
  isSaving,
  onStepComplete,
  isJustCompleted,
  isUnlocking
}: VenueStepProps) {
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
          <div className={cn(
            "w-7 h-7 md:w-8 md:h-8 rounded-[8px] md:rounded-[10px] flex items-center justify-center text-xs md:text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm flex-shrink-0",
            isCompleted 
              ? "bg-success text-success-foreground" 
              : "bg-card text-muted-foreground",
            isJustCompleted && "animate-pop"
          )}>
            {isCompleted ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4 animate-pop" strokeWidth={2.5} /> : "C"}
          </div>
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
