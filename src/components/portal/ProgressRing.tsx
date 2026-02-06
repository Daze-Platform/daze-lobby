import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Rocket } from "lucide-react";

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
  // Use responsive sizing - on mobile (size < 180), scale down proportionally
  const effectiveSize = size;
  const effectiveStrokeWidth = size < 180 ? Math.round(strokeWidth * (size / 180)) : strokeWidth;
  const radius = (effectiveSize - effectiveStrokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  const [isPulsing, setIsPulsing] = useState(false);
  const [showRocket, setShowRocket] = useState(false);
  const [rocketLaunched, setRocketLaunched] = useState(false);
  const [isHeartbeating, setIsHeartbeating] = useState(false);
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

  // Trigger rocket animation and heartbeat when status changes to live
  useEffect(() => {
    if (status === "live" && prevStatus.current !== "live") {
      // Trigger heartbeat pulse
      setIsHeartbeating(true);
      setTimeout(() => setIsHeartbeating(false), 500);
      // Delay rocket appearance for dramatic effect
      const timer = setTimeout(() => {
        setShowRocket(true);
        // After launch animation completes, switch to jitter
        setTimeout(() => setRocketLaunched(true), 600);
      }, 500);
      return () => clearTimeout(timer);
    } else if (status === "live") {
      setShowRocket(true);
      setRocketLaunched(true);
    } else {
      setShowRocket(false);
      setRocketLaunched(false);
    }
    prevStatus.current = status;
  }, [status]);

  const isLive = status === "live";
  const isReviewing = status === "reviewing";

  // Generate gradient ID unique to this component instance
  const gradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn(
      "relative inline-flex items-center justify-center transition-all duration-500",
      isLive && "glow-success",
      isHeartbeating && "animate-heartbeat",
      className
    )}>
      <svg
        width={effectiveSize}
        height={effectiveSize}
        className="transform -rotate-90"
      >
        {/* Gradient definition for in-progress state */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {/* Ocean Blue to Sunset Orange */}
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>

        {/* Background circle - subtle, refined */}
        <circle
          cx={effectiveSize / 2}
          cy={effectiveSize / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={effectiveStrokeWidth}
          strokeLinecap="round"
        />

        {/* Progress circle - gradient for in-progress, solid green for live */}
        <circle
          cx={effectiveSize / 2}
          cy={effectiveSize / 2}
          r={radius}
          fill="none"
          stroke={isLive ? "#10B981" : `url(#${gradientId})`}
          strokeWidth={effectiveStrokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: isLive ? "drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))" : undefined
          }}
        />
      </svg>

      {/* Center text - refined typography */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-center transition-transform duration-500",
        isPulsing && "animate-progress-pulse"
      )}>
        <span className={cn(
          "font-bold tracking-tight tabular-nums transition-colors duration-500",
          effectiveSize < 160 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
          isLive ? "text-emerald-500" : "text-foreground"
        )}>{Math.round(progress)}%</span>
        <div className="flex items-center gap-1.5">
          {isLive && showRocket && (
            <Rocket 
              className={cn(
                "w-5 h-5 text-amber-400",
                rocketLaunched ? "animate-rocket-jitter" : "animate-rocket-launch",
                "drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
              )}
              strokeWidth={1.5}
              fill="currentColor"
            />
          )}
          <span className={cn(
            "text-sm tracking-wide transition-colors duration-500",
            isLive ? "text-emerald-500 font-semibold" : "text-muted-foreground"
          )}>
            {isLive ? "Launched" : isReviewing ? "In Review" : "Ready for Takeoff"}
          </span>
        </div>
      </div>
    </div>
  );
}
