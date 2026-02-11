import { useEffect, useState, useRef, useMemo } from "react";
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

  // Trigger heartbeat when reaching 100%
  useEffect(() => {
    if (progress === 100 && prevProgress.current < 100) {
      setIsHeartbeating(true);
      const timer = setTimeout(() => setIsHeartbeating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Trigger rocket animation and heartbeat when status changes to live
  useEffect(() => {
    if (status === "live" && prevStatus.current !== "live") {
      // Trigger heartbeat pulse
      setIsHeartbeating(true);
      setTimeout(() => setIsHeartbeating(false), 600);
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
  const isComplete = progress === 100;

  // Generate gradient ID unique to this component instance
  const gradientId = useMemo(() => `progress-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
  const glowFilterId = useMemo(() => `glow-filter-${Math.random().toString(36).substr(2, 9)}`, []);

  // Calculate the position of the progress tip for the glow effect
  const progressAngle = (progress / 100) * 360; // CSS -rotate-90 already handles the top start
  const tipX = effectiveSize / 2 + radius * Math.cos((progressAngle * Math.PI) / 180);
  const tipY = effectiveSize / 2 + radius * Math.sin((progressAngle * Math.PI) / 180);

  return (
    <div className={cn(
      "relative inline-flex items-center justify-center transition-all duration-500",
      isLive && "glow-success",
      isComplete && !isLive && "glow-complete",
      isHeartbeating && "animate-heartbeat-complete",
      className
    )}>
      <svg
        width={effectiveSize}
        height={effectiveSize}
        className="transform -rotate-90"
      >
        {/* Gradient & filter definitions */}
        <defs>
          {/* Ocean Blue to Sunset Orange gradient for in-progress */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          
          {/* Glow filter for the tip pulse */}
          <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
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

        {/* Progress circle - gradient for in-progress, solid green for live/complete */}
        <circle
          cx={effectiveSize / 2}
          cy={effectiveSize / 2}
          r={radius}
          fill="none"
          stroke={isLive || isComplete ? "#10B981" : `url(#${gradientId})`}
          strokeWidth={effectiveStrokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: (isLive || isComplete) ? "drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))" : undefined
          }}
        />

        {/* Glowing pulse at the tip of the progress bar - only when actively progressing (not 100%) */}
        {progress > 0 && progress < 100 && !isLive && (
          <circle
            cx={tipX}
            cy={tipY}
            r={effectiveStrokeWidth / 2 + 2}
            fill="#F97316"
            className="animate-tip-pulse"
            filter={`url(#${glowFilterId})`}
          />
        )}
      </svg>

      {/* Center text - refined typography */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-center transition-transform duration-500",
        isPulsing && "animate-progress-pulse"
      )}>
        <span className={cn(
          "font-bold tracking-tight tabular-nums transition-colors duration-500",
          effectiveSize < 160 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
          (isLive || isComplete) ? "text-emerald-500" : "text-foreground"
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
            (isLive || isComplete) ? "text-emerald-500 font-semibold" : "text-muted-foreground"
          )}>
            {isLive ? "Launched" : isComplete ? "Complete" : isReviewing ? "In Review" : "Ready for Takeoff"}
          </span>
        </div>
      </div>
    </div>
  );
}
