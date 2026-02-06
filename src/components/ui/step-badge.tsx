import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepBadgeStatus = "pending" | "active" | "complete" | "locked";

interface StepBadgeProps {
  step: "A" | "B" | "C" | "D";
  status: StepBadgeStatus;
  isJustCompleted?: boolean;
}

export function StepBadge({ step, status, isJustCompleted }: StepBadgeProps) {
  return (
    <div
      className={cn(
        // Base styles
        "w-7 h-7 md:w-8 md:h-8 rounded-[10px] md:rounded-[12px] flex items-center justify-center",
        "font-display text-sm md:text-base font-semibold tracking-tight",
        "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "flex-shrink-0 relative",
        
        // State-specific styles
        status === "pending" && [
          "bg-card text-muted-foreground",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.05)]",
        ],
        
        status === "active" && [
          "bg-card text-primary",
          "shadow-[0_0_0_2px_hsl(var(--primary)/0.3),0_4px_12px_-2px_hsl(var(--primary)/0.25)]",
          "animate-badge-glow",
        ],
        
        status === "complete" && [
          "bg-success text-success-foreground",
          "shadow-[0_0_12px_2px_hsl(var(--success)/0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        ],
        
        status === "locked" && [
          "bg-muted/50 text-muted-foreground/50",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]",
        ],
        
        // Animation on just completed
        isJustCompleted && "animate-celebrate"
      )}
    >
      {status === "complete" ? (
        <Check 
          className={cn(
            "w-3.5 h-3.5 md:w-4 md:h-4",
            isJustCompleted && "animate-check-pop"
          )} 
          strokeWidth={2.5} 
        />
      ) : status === "locked" ? (
        <Lock className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2} />
      ) : (
        step
      )}
    </div>
  );
}
