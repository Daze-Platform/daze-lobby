import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface IconContainerProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "success" | "warning" | "muted";
  className?: string;
  iconClassName?: string;
}

const sizeClasses = {
  sm: { container: "w-8 h-8", icon: "w-4 h-4", radius: "rounded-[8px]" },
  md: { container: "w-10 h-10", icon: "w-5 h-5", radius: "rounded-[10px]" },
  lg: { container: "w-12 h-12", icon: "w-6 h-6", radius: "rounded-[12px]" },
  xl: { container: "w-16 h-16", icon: "w-8 h-8", radius: "rounded-[14px]" },
};

const variantClasses = {
  default: {
    container: "bg-card shadow-sm",
    icon: "text-muted-foreground",
  },
  primary: {
    container: "bg-primary/10",
    icon: "text-primary",
  },
  success: {
    container: "bg-success/10",
    icon: "text-success",
  },
  warning: {
    container: "bg-warning/10",
    icon: "text-warning",
  },
  muted: {
    container: "bg-muted/50",
    icon: "text-muted-foreground/70",
  },
};

/**
 * Premium Icon Container - Series C Squircle aesthetic
 * Wraps icons in soft-shadowed containers for "Feature Block" look
 * 
 * Usage:
 * <IconContainer icon={Building2} size="md" variant="primary" />
 */
export function IconContainer({
  icon: Icon,
  size = "md",
  variant = "default",
  className,
  iconClassName,
}: IconContainerProps) {
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];

  return (
    <div
      className={cn(
        "flex items-center justify-center transition-colors",
        sizeClass.container,
        sizeClass.radius,
        variantClass.container,
        className
      )}
    >
      <Icon
        className={cn(sizeClass.icon, variantClass.icon, iconClassName)}
        strokeWidth={1.5}
      />
    </div>
  );
}

/**
 * Icon Stack for empty states - Creates depth with overlapping icons
 * 
 * Usage:
 * <IconStack 
 *   backgroundIcon={FileText} 
 *   foregroundIcon={Plus} 
 * />
 */
interface IconStackProps {
  backgroundIcon: LucideIcon;
  foregroundIcon: LucideIcon;
  className?: string;
}

export function IconStack({
  backgroundIcon: BackgroundIcon,
  foregroundIcon: ForegroundIcon,
  className,
}: IconStackProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <BackgroundIcon
        className="w-12 h-12 text-muted/50"
        strokeWidth={1.5}
      />
      <ForegroundIcon
        className="absolute w-6 h-6 text-muted-foreground translate-x-1 translate-y-1"
        strokeWidth={1.5}
      />
    </div>
  );
}

/**
 * Status Icon - Distinct visual states for task/item status
 */
interface StatusIconProps {
  status: "pending" | "complete" | "locked";
  size?: "sm" | "md";
  className?: string;
}

export function StatusIcon({ status, size = "md", className }: StatusIconProps) {
  const sizeClass = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const innerSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  if (status === "complete") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-success text-success-foreground",
          sizeClass,
          className
        )}
      >
        <svg
          className={innerSize}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          sizeClass,
          className
        )}
      >
        <svg
          className={innerSize}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
    );
  }

  // pending - simple grey ring
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-muted bg-transparent",
        sizeClass,
        className
      )}
    />
  );
}
