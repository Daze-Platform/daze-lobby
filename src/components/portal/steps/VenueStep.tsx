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
        "border rounded-lg px-4 bg-card relative overflow-hidden transition-all duration-300",
        isLocked && "opacity-50 pointer-events-none",
        isUnlocking && "animate-unlock-glow"
      )}
      disabled={isLocked}
    >
      <StepCompletionEffect isActive={isJustCompleted || false} />
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
            isCompleted 
              ? "bg-success text-success-foreground" 
              : "bg-muted text-muted-foreground",
            isJustCompleted && "animate-celebrate"
          )}>
            {isCompleted ? <Check className="w-4 h-4" /> : "C"}
          </div>
          <div className="text-left">
            <p className="font-medium">Venue Manager</p>
            <p className="text-sm text-muted-foreground">Add venues and upload menus for each location</p>
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
