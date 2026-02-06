import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Rocket, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface WelcomeTourProps {
  onComplete: () => void;
}

const TOUR_SLIDES = [
  {
    icon: Sparkles,
    headline: "Welcome to the Future of Service.",
    body: "Daze transforms your venue into a seamless digital experience. No waiting, just ordering.",
    accentColor: "from-primary/20 to-primary/5",
  },
  {
    icon: Rocket,
    headline: "You Provide the Soul, We Handle the Tech.",
    body: "Simply upload your menus and branding. We configure the hardware, train your staff, and launch your pilot.",
    accentColor: "from-warning/20 to-warning/5",
  },
  {
    icon: CheckCircle2,
    headline: "Ready for Takeoff?",
    body: "Complete these 3 setup tasks to activate your 90-day pilot.",
    accentColor: "from-success/20 to-success/5",
    isFinal: true,
  },
];

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  const slide = TOUR_SLIDES[currentSlide];
  const isLastSlide = currentSlide === TOUR_SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      setSlideDirection("right");
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstSlide) {
      setSlideDirection("left");
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
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
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center",
        "transition-all duration-300",
        isExiting ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-slate-900/40 backdrop-blur-xl",
          "transition-opacity duration-500",
          isExiting ? "opacity-0" : "opacity-100"
        )}
        onClick={handleComplete}
      />

      {/* The Stage - Premium Card */}
      <div
        className={cn(
          "relative w-[600px] h-[500px] bg-white dark:bg-card rounded-3xl shadow-2xl overflow-hidden",
          "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isExiting ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )}
      >
        {/* Gradient Accent Background */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br transition-all duration-500",
            slide.accentColor
          )}
        />

        {/* Content Container */}
        <div className="relative h-full flex flex-col">
          {/* Skip Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComplete}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Skip Tour
            </Button>
          </div>

          {/* Slide Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-12 py-8 text-center">
            {/* Icon with Squircle Container */}
            <div 
              className={cn(
                "relative mb-8 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                "animate-fade-in-up"
              )}
              key={`icon-${currentSlide}`}
            >
              {/* Large faint background icon */}
              <div className="absolute -inset-6 flex items-center justify-center opacity-10">
                <slide.icon className="w-32 h-32" strokeWidth={1} />
              </div>
              {/* Squircle container with icon */}
              <div className="relative w-20 h-20 flex items-center justify-center bg-card rounded-[20px] shadow-soft-lg">
                <slide.icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
              </div>
            </div>

            {/* Headline */}
            <h1 
              className={cn(
                "font-display text-3xl font-bold tracking-tight text-foreground mb-4",
                "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                "animate-fade-in-up"
              )}
              style={{ animationDelay: "50ms" }}
              key={`headline-${currentSlide}`}
            >
              {slide.headline}
            </h1>

            {/* Body */}
            <p 
              className={cn(
                "text-lg text-muted-foreground max-w-md leading-relaxed",
                "transition-all duration-500",
                "animate-fade-in-up"
              )}
              style={{ animationDelay: "100ms" }}
              key={`body-${currentSlide}`}
            >
              {slide.body}
            </p>
          </div>

          {/* Navigation Footer */}
          <div className="px-8 pb-8 pt-4">
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {TOUR_SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSlideDirection(index > currentSlide ? "right" : "left");
                    setCurrentSlide(index);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    index === currentSlide 
                      ? "w-8 bg-primary" 
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="lg"
                onClick={handlePrev}
                disabled={isFirstSlide}
                className={cn(
                  "gap-2 transition-opacity",
                  isFirstSlide && "opacity-0 pointer-events-none"
                )}
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                Back
              </Button>

              {isLastSlide ? (
                <Button
                  size="lg"
                  onClick={handleComplete}
                  className={cn(
                    "gap-2 px-8 text-base font-semibold",
                    "bg-primary hover:bg-primary/90",
                    "animate-gentle-pulse shadow-colored"
                  )}
                >
                  Start My Journey
                  <Rocket className="w-5 h-5" strokeWidth={1.5} />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="gap-2 px-8"
                >
                  Next
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
