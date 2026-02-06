import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({ 
  progress, 
  size = 180, 
  strokeWidth = 12,
  className 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  const [isPulsing, setIsPulsing] = useState(false);
  const prevProgress = useRef(progress);

  // Trigger pulse animation when progress increases
  useEffect(() => {
    if (progress > prevProgress.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 500);
      return () => clearTimeout(timer);
    }
    prevProgress.current = progress;
  }, [progress]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-center transition-transform duration-500",
        isPulsing && "animate-progress-pulse"
      )}>
        <span className="text-4xl font-bold text-foreground">{Math.round(progress)}%</span>
        <span className="text-sm text-muted-foreground">Ready for Takeoff</span>
      </div>
    </div>
  );
}
