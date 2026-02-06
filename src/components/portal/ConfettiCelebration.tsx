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

      // Daze brand colors: Ocean Blue, Sunset Orange, Emerald Green
      const brandColors = ['#0EA5E9', '#38BDF8', '#F97316', '#FB923C', '#10B981', '#34D399'];

      // Left burst at 0ms
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: brandColors,
      });

      // Right burst at 150ms
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: brandColors,
        });
      }, 150);

      // Center shower at 300ms
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { x: 0.5, y: 0 },
          gravity: 1.2,
          colors: brandColors,
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
          colors: ['#0EA5E9', '#F97316', '#10B981'],
        });

        confetti({
          particleCount: 30,
          angle: 120,
          spread: 40,
          origin: { x: 1, y: 0.7 },
          colors: ['#0EA5E9', '#F97316', '#10B981'],
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
