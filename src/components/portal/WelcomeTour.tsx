import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronLeft, Utensils, Upload, Rocket } from "lucide-react";

interface WelcomeTourProps {
  onComplete: () => void;
}

// Brand Colors
const BRAND = {
  midnight: "#0F172A",
  ocean: "#0EA5E9",
  sunset: "#F97316",
};

const TOUR_SLIDES = [
  {
    headline: "Welcome to a brighter day.",
    subtext: "Daze transforms your venue into a seamless digital experience. No waiting, just ordering.",
    icon: Utensils,
  },
  {
    headline: "Effortless service, floating on air.",
    subtext: "Simply upload your menus and branding. We configure the hardware, train your staff, and launch your pilot.",
    icon: Upload,
  },
  {
    headline: "Ready for Takeoff?",
    subtext: "Complete these 3 setup tasks to activate your 90-day pilot.",
    icon: Rocket,
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
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isExiting, setIsExiting] = useState(false);

  const slide = TOUR_SLIDES[currentSlide];
  const isLastSlide = currentSlide === TOUR_SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;
  const Icon = slide.icon;

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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Solid Deep Midnight Background - Clean premium void */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: BRAND.midnight }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        onClick={handleComplete}
      />

      {/* The Stage - Pure White Card (Dark Room, Bright Card) */}
      <motion.div
        className={cn(
          "relative w-full max-w-[95vw] md:max-w-[640px] max-h-[85vh] md:max-h-none overflow-y-auto",
          // Solid pure white - no glassmorphism
          "bg-white",
          // Deeply rounded corners like cloud logo
          "rounded-2xl md:rounded-3xl",
          // Subtle shadow for depth
          "shadow-2xl"
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
          className="absolute top-3 md:top-4 right-3 md:right-4 z-10 text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Skip
        </motion.button>

        {/* Content Container */}
        <div className="relative px-6 md:px-12 py-10 md:py-16">
          {/* The Floating Cloud Container */}
          <div className="relative w-28 h-28 md:w-40 md:h-40 mx-auto mb-6 md:mb-10 flex items-center justify-center">
            {/* Cloud container with drift animation */}
            <motion.div
              className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-sky-50 flex items-center justify-center"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Soft shadow for floating effect */}
              <div className="absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 w-16 md:w-20 h-3 md:h-4 bg-slate-200/50 rounded-full blur-md" />
              
              {/* Brand Icon */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon 
                    className="w-10 h-10 md:w-14 md:h-14" 
                    style={{ color: BRAND.ocean }}
                    strokeWidth={1.5}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Text Content with slide transitions */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {/* Headline - Solid Black, Bold */}
              <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4 tracking-tight">
                {slide.headline}
              </h1>

              {/* Subtext - Relaxed gray */}
              <p className="text-base text-slate-500 text-center max-w-md leading-relaxed">
                {slide.subtext}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10">
            {/* Sunset Striping Progress Dots */}
            <div className="flex items-center justify-center gap-2.5 mb-8">
              {TOUR_SLIDES.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentSlide ? 1 : -1);
                    setCurrentSlide(index);
                  }}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: index === currentSlide ? 32 : 8,
                    backgroundColor: index === currentSlide 
                      ? BRAND.sunset  // Active: Sunset Orange
                      : `${BRAND.ocean}4D`, // Inactive: Ocean Blue at 30% opacity
                  }}
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
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 gap-2"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  Back
                </Button>
              </motion.div>

              {/* Ocean Blue Button with Sunset Hover */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Button
                  size="lg"
                  onClick={handleNext}
                  className={cn(
                    "gap-3 px-8 text-base font-semibold rounded-full",
                    "text-white",
                    "transition-colors duration-300"
                  )}
                  style={{ 
                    backgroundColor: BRAND.ocean,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND.sunset;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND.ocean;
                  }}
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
