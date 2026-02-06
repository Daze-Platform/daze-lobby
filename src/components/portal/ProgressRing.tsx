import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import rocketImage from "@/assets/rocket-launched.png";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  status?: "onboarding" | "reviewing" | "live";
  className?: string;
}

export function ProgressRing({ 
  progress, 
  size = 180, 
  strokeWidth = 12,
  status = "onboarding",
  className 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  const [isPulsing, setIsPulsing] = useState(false);
  const [showRocket, setShowRocket] = useState(false);
  const prevProgress = useRef(progress);
  const prevStatus = useRef(status);

  // Trigger pulse animation when progress increases
  useEffect(() => {
    if (progress > prevProgress.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 500);
      return () => clearTimeout(timer);
    }
    prevProgress.current = progress;
  }, [progress]);

  // Trigger rocket animation when status changes to live
  useEffect(() => {
    if (status === "live" && prevStatus.current !== "live") {
      // Delay rocket appearance for dramatic effect
      const timer = setTimeout(() => setShowRocket(true), 500);
      return () => clearTimeout(timer);
    } else if (status === "live") {
      setShowRocket(true);
    } else {
      setShowRocket(false);
    }
    prevStatus.current = status;
  }, [status]);

  const isLive = status === "live";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle - subtle, refined */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress circle - smooth gradient feel */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isLive ? "hsl(var(--success))" : "hsl(var(--primary))"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out drop-shadow-sm"
        />
      </svg>
      {/* Center text - refined typography */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-center transition-transform duration-500",
        isPulsing && "animate-progress-pulse"
      )}>
        <span className="text-4xl font-bold tracking-tight text-foreground">{Math.round(progress)}%</span>
        <div className="flex items-center gap-1.5">
          {isLive && showRocket && (
            <img 
              src={rocketImage} 
              alt="Launched" 
              className="w-6 h-6 animate-rocket-launch object-contain" 
            />
          )}
          <span className={cn(
            "text-sm tracking-wide transition-colors duration-300",
            isLive ? "text-success font-medium" : "text-muted-foreground"
          )}>
            {isLive ? "Launched" : "Ready for Takeoff"}
          </span>
        </div>
      </div>
    </div>
  );
}
