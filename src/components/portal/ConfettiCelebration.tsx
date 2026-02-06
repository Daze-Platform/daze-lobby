import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function ConfettiCelebration({ trigger, onComplete }: ConfettiCelebrationProps) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;
      
      const duration = 3000;
      const end = Date.now() + duration;

      // Left burst at 0ms
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#fbbf24'],
      });

      // Right burst at 150ms
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#fbbf24'],
        });
      }, 150);

      // Center shower at 300ms
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { x: 0.5, y: 0 },
          gravity: 1.2,
          colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#fbbf24'],
        });
      }, 300);

      // Continuous smaller bursts
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          onComplete?.();
          return;
        }

        confetti({
          particleCount: 30,
          angle: 60,
          spread: 40,
          origin: { x: 0, y: 0.7 },
          colors: ['#3b82f6', '#60a5fa', '#22c55e'],
        });

        confetti({
          particleCount: 30,
          angle: 120,
          spread: 40,
          origin: { x: 1, y: 0.7 },
          colors: ['#3b82f6', '#60a5fa', '#22c55e'],
        });
      }, 400);

      return () => clearInterval(interval);
    }
  }, [trigger, onComplete]);

  // Reset trigger flag when trigger becomes false
  useEffect(() => {
    if (!trigger) {
      hasTriggered.current = false;
    }
  }, [trigger]);

  return null;
}
