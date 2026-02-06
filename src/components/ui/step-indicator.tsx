import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

interface StepIndicatorProps {
  step: string | number;
  status: "pending" | "complete" | "locked" | "active";
  className?: string;
}

/**
 * Premium Step Indicator - Consistent step badges across onboarding
 * 
 * Uses design tokens and refined iconography
 */
export function StepIndicator({ step, status, className }: StepIndicatorProps) {
  const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
  
  if (status === "complete") {
    return (
      <div className={cn(baseClasses, "bg-success text-success-foreground", className)}>
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </div>
    );
  }
  
  if (status === "locked") {
    return (
      <div className={cn(baseClasses, "bg-muted/60 text-muted-foreground", className)}>
        <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
      </div>
    );
  }
  
  if (status === "active") {
    return (
      <div className={cn(baseClasses, "bg-primary/10 text-primary ring-2 ring-primary/20", className)}>
        {step}
      </div>
    );
  }
  
  // pending
  return (
    <div className={cn(baseClasses, "bg-muted text-muted-foreground", className)}>
      {step}
    </div>
  );
}
