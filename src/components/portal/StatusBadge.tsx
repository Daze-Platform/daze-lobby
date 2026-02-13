import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Eye } from "lucide-react";

type OnboardingStatus = "onboarding" | "reviewing" | "live";

interface StatusBadgeProps {
  status: OnboardingStatus;
  className?: string;
}

const statusConfig: Record<OnboardingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  onboarding: {
    label: "Onboarding",
    variant: "secondary",
  },
  reviewing: {
    label: "In Review",
    variant: "outline",
  },
  live: {
    label: "Live",
    variant: "default",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const isLive = status === "live";
  const isReviewing = status === "reviewing";
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "text-sm px-3 py-1.5 transition-all duration-300",
        isLive && "bg-emerald-500 text-white border-0 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-live-pulse",
        isReviewing && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
        className
      )}
    >
      {isLive && (
        <Check className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />
      )}
      {isReviewing && (
        <Eye className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
      )}
      {config.label}
    </Badge>
  );
}
