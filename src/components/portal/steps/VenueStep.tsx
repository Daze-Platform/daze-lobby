import { useState, useEffect } from "react";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { VenueManager } from "../VenueManager";
import type { Venue } from "../VenueCard";

interface VenueStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  data?: Record<string, unknown>;
  venues: Venue[];
  onVenuesChange: (venues: Venue[]) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function VenueStep({ 
  isCompleted, 
  isLocked, 
  data, 
  venues,
  onVenuesChange,
  onSave,
  isSaving 
}: VenueStepProps) {
  return (
    <AccordionItem 
      value="venue" 
      className={cn(
        "border rounded-lg px-4 bg-card",
        isLocked && "opacity-50 pointer-events-none"
      )}
      disabled={isLocked}
    >
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            isCompleted 
              ? "bg-success text-success-foreground" 
              : "bg-muted text-muted-foreground"
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
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
