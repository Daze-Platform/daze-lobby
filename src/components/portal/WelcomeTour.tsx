import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronLeft } from "lucide-react";

interface WelcomeTourProps {
  onComplete: () => void;
}

const TOUR_SLIDES = [
  {
    headline: "Welcome to the Future of Service.",
    subtext: "Daze transforms your venue into a seamless digital experience. No waiting, just ordering.",
  },
  {
    headline: "You Provide the Soul, We Handle the Tech.",
    subtext: "Simply upload your menus and branding. We configure the hardware, train your staff, and launch your pilot.",
  },
  {
    headline: "Ready for Takeoff?",
    subtext: "Complete these 3 setup tasks to activate your 90-day pilot.",
    isFinal: true,
  },
];

// Spring physics for premium feel
const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

// Cinematic text transition variants
const textVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    filter: "blur(8px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    filter: "blur(8px)",
  }),
};

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isExiting, setIsExiting] = useState(false);

  const slide = TOUR_SLIDES[currentSlide];
  const isLastSlide = currentSlide === TOUR_SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstSlide) {
      setDirection(-1);
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

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Deep Space Background - Animated radial gradient */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        onClick={handleComplete}
      />

      {/* Ambient floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* The Stage - Black Glass Card */}
      <motion.div
        className={cn(
          "relative w-[640px] max-w-[95vw] overflow-hidden",
          // Black Glass effect
          "bg-black/40 backdrop-blur-2xl",
          "border border-white/10",
          "rounded-3xl",
          // Ambient light glow from top
          "shadow-[0_-20px_80px_-20px_rgba(56,189,248,0.3)]"
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
          className="absolute top-4 right-4 z-10 text-white/40 hover:text-white text-xs font-medium transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Skip Tour
        </motion.button>

        {/* Content Container */}
        <div className="relative px-12 py-16">
          {/* The Living Core - Heartbeat Animation */}
          <div className="relative w-48 h-48 mx-auto mb-12 flex items-center justify-center">
            {/* Outer spinning ring - Y axis */}
            <motion.div
              className="absolute w-32 h-32 rounded-full border border-white/20"
              style={{ rotateX: 60 }}
              animate={{ rotateZ: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Middle spinning ring - X axis */}
            <motion.div
              className="absolute w-24 h-24 rounded-full border border-cyan-400/30"
              style={{ rotateY: 60 }}
              animate={{ rotateZ: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Inner spinning ring */}
            <motion.div
              className="absolute w-16 h-16 rounded-full border border-white/15"
              style={{ rotateX: -45, rotateY: 45 }}
              animate={{ rotateZ: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Breathing Core - The heartbeat */}
            <motion.div
              className="relative z-10"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Outer glow */}
              <motion.div
                className="absolute inset-0 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-cyan-400/40 rounded-full blur-md"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Core sphere */}
              <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
            </motion.div>
          </div>

          {/* Cinematic Text with blur transitions */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {/* Editorial Typography */}
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white text-center mb-4 tracking-tight">
                {slide.headline}
              </h1>

              <p className="text-lg text-slate-400 text-center max-w-md leading-relaxed">
                {slide.subtext}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-12">
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {TOUR_SLIDES.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentSlide ? 1 : -1);
                    setCurrentSlide(index);
                  }}
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
                  className="text-white/50 hover:text-white hover:bg-white/10 gap-2"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  Back
                </Button>
              </motion.div>

              {/* Haptic Pill Button */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Button
                  size="lg"
                  onClick={handleNext}
                  className={cn(
                    "gap-3 px-8 text-base font-semibold rounded-full",
                    // Solid white pill
                    "bg-white text-slate-900",
                    "hover:bg-white",
                    // White glow on hover
                    "shadow-lg",
                    "hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]",
                    "transition-shadow duration-300",
                    // Haptic press feedback
                    "active:scale-95"
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
