import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Smartphone, Star, Zap, Sparkles, ArrowRight, ChevronLeft } from "lucide-react";

interface WelcomeTourProps {
  onComplete: () => void;
}

const TOUR_SLIDES = [
  {
    headline: "Welcome to the Future of Service.",
    subtext: "Daze transforms your venue into a seamless digital experience. No waiting, just ordering.",
    icons: [Smartphone, Star],
    orbColors: "from-cyan-400 via-blue-500 to-purple-600",
  },
  {
    headline: "You Provide the Soul, We Handle the Tech.",
    subtext: "Simply upload your menus and branding. We configure the hardware, train your staff, and launch your pilot.",
    icons: [Zap, Sparkles],
    orbColors: "from-amber-400 via-orange-500 to-rose-600",
  },
  {
    headline: "Ready for Takeoff?",
    subtext: "Complete these 3 setup tasks to activate your 90-day pilot.",
    icons: [Star, Sparkles],
    orbColors: "from-emerald-400 via-teal-500 to-cyan-600",
    isFinal: true,
  },
];

// Spring physics for premium feel
const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const slide = TOUR_SLIDES[currentSlide];
  const isLastSlide = currentSlide === TOUR_SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstSlide) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "Escape") handleComplete();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  const Icon1 = slide.icons[0];
  const Icon2 = slide.icons[1];

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Theater Mode Background - Deep gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B1120] to-slate-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        onClick={handleComplete}
      />

      {/* Ambient glow particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* The Stage - Glass Card with massive glow */}
      <motion.div
        className={cn(
          "relative w-[640px] max-w-[95vw] overflow-hidden",
          // Glass effect
          "bg-white/5 backdrop-blur-xl",
          "border border-white/10",
          "rounded-3xl",
          // Massive colored glow
          "shadow-[0_0_100px_-20px_rgba(56,189,248,0.3)]"
        )}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ 
          scale: isExiting ? 0.95 : 1, 
          opacity: isExiting ? 0 : 1,
          y: isExiting ? 20 : 0,
        }}
        transition={springTransition}
      >
        {/* Skip Button */}
        <motion.button
          onClick={handleComplete}
          className="absolute top-4 right-4 z-10 text-slate-500 hover:text-white text-xs font-medium transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Skip Tour
        </motion.button>

        {/* Content Container */}
        <div className="relative px-12 py-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {/* Hero Composition - Glowing Orb + Floating Icons */}
              <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
                {/* The Glowing Orb - Spinning conic gradient */}
                <motion.div
                  className={cn(
                    "absolute w-40 h-40 rounded-full blur-2xl opacity-60",
                    "bg-conic-gradient",
                  )}
                  style={{
                    background: `conic-gradient(${slide.orbColors.includes("cyan") ? "#22d3ee, #3b82f6, #a855f7, #22d3ee" : 
                      slide.orbColors.includes("amber") ? "#fbbf24, #f97316, #f43f5e, #fbbf24" :
                      "#34d399, #14b8a6, #22d3ee, #34d399"})`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Secondary subtle orb */}
                <motion.div
                  className="absolute w-32 h-32 rounded-full bg-white/5 blur-xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Floating Device Icons */}
                <div className="relative z-10 flex items-center justify-center">
                  <motion.div
                    className="absolute"
                    animate={{ 
                      y: [-8, 8, -8],
                      rotate: [-5, 5, -5],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon1 
                      className="w-24 h-24 text-white/90" 
                      strokeWidth={0.8}
                    />
                  </motion.div>
                  
                  <motion.div
                    className="absolute top-0 right-0 translate-x-8 -translate-y-2"
                    animate={{ 
                      y: [4, -8, 4],
                      rotate: [5, -5, 5],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <Icon2 
                      className="w-12 h-12 text-white/70" 
                      strokeWidth={1}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Editorial Typography */}
              <motion.h1
                className="font-display text-4xl md:text-5xl font-bold text-white text-center mb-4 tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {slide.headline}
              </motion.h1>

              <motion.p
                className="text-lg text-slate-400 text-center max-w-md leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {slide.subtext}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-12">
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {TOUR_SLIDES.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-colors",
                    index === currentSlide 
                      ? "w-8 bg-white" 
                      : "w-1.5 bg-white/30 hover:bg-white/50"
                  )}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to slide ${index + 1}`}
                  layout
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <motion.div
                initial={false}
                animate={{ opacity: isFirstSlide ? 0 : 1 }}
              >
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handlePrev}
                  disabled={isFirstSlide}
                  className="text-slate-400 hover:text-white hover:bg-white/10 gap-2"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  Back
                </Button>
              </motion.div>

              {/* Glowing Pill Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  onClick={handleNext}
                  className={cn(
                    "gap-3 px-8 text-base font-semibold rounded-full",
                    // White background, black text
                    "bg-white text-slate-900",
                    "hover:bg-white",
                    // Glowing effect
                    "shadow-[0_0_20px_rgba(255,255,255,0.3)]",
                    "hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]",
                    "transition-shadow duration-300"
                  )}
                >
                  {isLastSlide ? "Start My Journey" : "Next"}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
