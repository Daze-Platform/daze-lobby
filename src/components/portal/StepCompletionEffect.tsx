import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SparkleProps {
  delay: number;
  x: number;
  y: number;
}

function Sparkle({ delay, x, y }: SparkleProps) {
  return (
    <div
      className="absolute w-2 h-2 animate-sparkle"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}ms`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full text-primary"
      >
        <path
          d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

interface StepCompletionEffectProps {
  isActive: boolean;
  className?: string;
}

export function StepCompletionEffect({ isActive, className }: StepCompletionEffectProps) {
  const [sparkles, setSparkles] = useState<SparkleProps[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate random sparkle positions
      const newSparkles: SparkleProps[] = Array.from({ length: 8 }, (_, i) => ({
        delay: i * 75,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
      }));
      setSparkles(newSparkles);

      // Clean up after animation
      const timer = setTimeout(() => {
        setSparkles([]);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isActive || sparkles.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-10",
        className
      )}
    >
      {sparkles.map((sparkle, i) => (
        <Sparkle key={i} {...sparkle} />
      ))}
    </div>
  );
}
