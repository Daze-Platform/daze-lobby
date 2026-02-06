import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    label: "Reviewing",
    variant: "outline",
  },
  live: {
    label: "Live",
    variant: "default",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "text-sm px-3 py-1",
        status === "live" && "bg-success text-success-foreground",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
