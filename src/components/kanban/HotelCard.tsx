import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Cpu, GripVertical, Lock } from "lucide-react";
import type { Hotel } from "@/hooks/useHotels";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

interface HotelCardProps {
  hotel: Hotel;
  index: number;
  isDragging?: boolean;
  onBlockedClick?: (hotel: Hotel) => void;
  onCardClick?: (hotel: Hotel) => void;
}

// High-stiffness spring for snappy drop animation
const snapSpring = {
  type: "spring" as const,
  stiffness: 600,
  damping: 30,
};

export function DraggableHotelCard({ hotel, index, isDragging = false, onBlockedClick, onCardClick }: HotelCardProps) {
  const [isShaking, setIsShaking] = React.useState(false);
  const [showLockedTooltip, setShowLockedTooltip] = React.useState(false);

  // Disable sorting for blocked cards
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: hotel.id,
    disabled: hotel.hasBlocker, // Disable drag for blocked cards
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  // Track if we're in a drag operation
  const isDragActive = React.useRef(false);

  // Handle attempt to drag a blocked card - trigger shake
  const handleBlockedDragAttempt = React.useCallback(() => {
    if (hotel.hasBlocker) {
      setIsShaking(true);
      setShowLockedTooltip(true);
      setTimeout(() => setIsShaking(false), 500);
      setTimeout(() => setShowLockedTooltip(false), 2000);
    }
  }, [hotel.hasBlocker]);

  // Handle click on cards
  const handleCardClick = React.useCallback((e: React.MouseEvent) => {
    // Don't trigger click if we just finished dragging
    if (isDragActive.current) {
      isDragActive.current = false;
      return;
    }
    // Blocked cards open blocker modal
    if (hotel.hasBlocker && onBlockedClick) {
      e.stopPropagation();
      onBlockedClick(hotel);
    } else if (onCardClick) {
      // Non-blocked cards open detail panel
      e.stopPropagation();
      onCardClick(hotel);
    }
  }, [hotel, onBlockedClick, onCardClick]);

  // Handle mouse down on blocked cards - trigger shake
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (hotel.hasBlocker) {
      handleBlockedDragAttempt();
    }
  }, [hotel.hasBlocker, handleBlockedDragAttempt]);

  // Track drag state
  React.useEffect(() => {
    if (isSortableDragging) {
      isDragActive.current = true;
    }
  }, [isSortableDragging]);

  const daysInPhase = differenceInDays(
    new Date(),
    new Date(hotel.phase_started_at)
  );

  const initials = hotel.primaryContact?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const showDaysWarning = hotel.phase === "onboarding" && daysInPhase > 14;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={showLockedTooltip}>
        <TooltipTrigger asChild>
          <motion.div
            ref={setNodeRef}
            style={style}
            data-hotel-id={hotel.id}
            layout
            layoutId={hotel.id}
            initial={false}
            animate={{
              opacity: isBeingDragged ? 0.4 : 1,
              scale: isBeingDragged ? 0.98 : 1,
              x: isShaking ? [0, -4, 4, -4, 4, -2, 2, 0] : 0,
            }}
            transition={isShaking ? { duration: 0.5, ease: "easeInOut" } : snapSpring}
          >
            <Card
              className={cn(
                "group/card transition-shadow duration-150",
                hotel.hasBlocker 
                  ? "cursor-not-allowed" 
                  : "cursor-grab hover:shadow-soft-lg active:cursor-grabbing",
                hotel.hasBlocker && "border-destructive/50 border-2 bg-destructive/5 hover:shadow-soft-lg",
                isBeingDragged && "shadow-none"
              )}
              onClick={handleCardClick}
              onMouseDown={handleMouseDown}
              {...(hotel.hasBlocker ? {} : { ...attributes, ...listeners })}
            >
              <CardContent className="p-2.5 sm:p-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Drag Handle - Show lock for blocked cards */}
                  <div className={cn(
                    "mt-1 transition-colors flex-shrink-0",
                    hotel.hasBlocker 
                      ? "text-destructive/60" 
                      : "text-muted-foreground/40 group-hover/card:text-muted-foreground/70"
                  )}>
                    {hotel.hasBlocker ? (
                      <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </div>

            {/* Hotel Avatar */}
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 ring-2 ring-background shadow-soft">
              <AvatarImage src={hotel.logo_url || undefined} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {hotel.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Hotel Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">
                  {hotel.name}
                </span>
                {hotel.hasBlocker && (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 animate-gentle-pulse" />
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <Badge
                  variant={hotel.hasBlocker ? "destructive" : "secondary"}
                  className="text-2xs font-medium"
                >
                  {hotel.hasBlocker ? "Blocked" : "Healthy"}
                </Badge>

                {hotel.phase === "pilot_live" && hotel.dazeDeviceCount > 0 && (
                  <div className="flex items-center gap-1 text-2xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    <Cpu className="h-3 w-3" />
                    <span className="font-medium">
                      {hotel.dazeDeviceCount}
                    </span>
                  </div>
                )}

                {showDaysWarning && (
                  <span className="text-2xs font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                    {daysInPhase}d
                  </span>
                )}
              </div>

              {hotel.primaryContact && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-2xs bg-muted font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-2xs text-muted-foreground truncate">
                    {hotel.primaryContact.name}
                  </span>
                </div>
              )}
            </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-destructive text-destructive-foreground border-destructive"
        >
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            <span>Locked: Resolve blocker before moving</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Overlay card shown while dragging - "Tactile Lift" effect
interface HotelCardOverlayProps {
  hotel: Hotel;
}

export function HotelCardOverlay({ hotel }: HotelCardOverlayProps) {
  const daysInPhase = differenceInDays(
    new Date(),
    new Date(hotel.phase_started_at)
  );

  const initials = hotel.primaryContact?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const showDaysWarning = hotel.phase === "onboarding" && daysInPhase > 14;

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ 
        scale: 1.03,
      }}
      transition={snapSpring}
    >
      <Card
        className={cn(
          "cursor-grabbing shadow-2xl",
          // Ocean Blue ring for active state
          "ring-2 ring-[hsl(199,89%,48%)]/40 ring-offset-2 ring-offset-background",
          "shadow-[0_25px_50px_-12px_hsl(199,89%,48%,0.3)]",
          hotel.hasBlocker && "border-destructive/50 border-2 bg-destructive/5"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Drag Handle - Active state */}
            <div className="mt-1 text-[hsl(199,89%,48%)]">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Hotel Avatar */}
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-[hsl(199,89%,48%)]/30 shadow-soft">
              <AvatarImage src={hotel.logo_url || undefined} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {hotel.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Hotel Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">
                  {hotel.name}
                </span>
                {hotel.hasBlocker && (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <Badge
                  variant={hotel.hasBlocker ? "destructive" : "secondary"}
                  className="text-2xs font-medium"
                >
                  {hotel.hasBlocker ? "Blocked" : "Healthy"}
                </Badge>

                {hotel.phase === "pilot_live" && hotel.dazeDeviceCount > 0 && (
                  <div className="flex items-center gap-1 text-2xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    <Cpu className="h-3 w-3" />
                    <span className="font-medium">
                      {hotel.dazeDeviceCount}
                    </span>
                  </div>
                )}

                {showDaysWarning && (
                  <span className="text-2xs font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                    {daysInPhase}d
                  </span>
                )}
              </div>

              {hotel.primaryContact && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-2xs bg-muted font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-2xs text-muted-foreground truncate">
                    {hotel.primaryContact.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Re-export for backwards compatibility
export { DraggableHotelCard as HotelCard };
