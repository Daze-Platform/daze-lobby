import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle, Cpu, GripVertical, Lock, DollarSign } from "lucide-react";
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

// Phase ring colors for avatars
const PHASE_RING_COLORS: Record<string, string> = {
  onboarding: "ring-blue-500/40",
  reviewing: "ring-purple-500/40",
  pilot_live: "ring-amber-500/40",
  contracted: "ring-emerald-500/40",
};

// High-stiffness spring for snappy drop animation
const snapSpring = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
};

// Format ARR for display
function formatARR(arr: number | null): string | null {
  if (!arr) return null;
  if (arr >= 1000) {
    return `$${Math.round(arr / 1000)}K`;
  }
  return `$${arr}`;
}

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
    disabled: hotel.hasBlocker,
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
    if (isDragActive.current) {
      isDragActive.current = false;
      return;
    }
    if (hotel.hasBlocker && onBlockedClick) {
      e.stopPropagation();
      onBlockedClick(hotel);
    } else if (onCardClick) {
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
  const formattedARR = hotel.phase === "contracted" ? formatARR(hotel.arr) : null;

  const isBeingDragged = isDragging || isSortableDragging;

  // Skip dnd-kit transform when dragging - DragOverlay handles visual positioning
  const style: React.CSSProperties = isBeingDragged 
    ? { opacity: 0, pointerEvents: "none" }  // Hidden - overlay is the visual representation
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={showLockedTooltip}>
        <TooltipTrigger asChild>
          <motion.div
            ref={setNodeRef}
            style={style}
            data-hotel-id={hotel.id}
            layout="position"
            initial={false}
            animate={{
              x: isShaking ? [0, -4, 4, -4, 4, -2, 2, 0] : 0,
            }}
            transition={isShaking ? { duration: 0.5, ease: "easeInOut" } : snapSpring}
          >
            <Card
              className={cn(
                "group/card transition-all duration-200 border",
                hotel.hasBlocker 
                  ? "cursor-not-allowed border-destructive/40 bg-destructive/5" 
                  : "cursor-grab hover:shadow-soft-lg hover:border-border active:cursor-grabbing",
                !hotel.hasBlocker && "hover:-translate-y-0.5",
                isBeingDragged && "shadow-none"
              )}
              onClick={handleCardClick}
              onMouseDown={handleMouseDown}
              {...(hotel.hasBlocker ? {} : { ...attributes, ...listeners })}
            >
              <CardContent className="p-3 sm:p-3.5">
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className={cn(
                    "mt-1.5 transition-colors flex-shrink-0",
                    hotel.hasBlocker 
                      ? "text-destructive/50" 
                      : "text-muted-foreground/30 group-hover/card:text-muted-foreground/60"
                  )}>
                    {hotel.hasBlocker ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <GripVertical className="h-4 w-4" />
                    )}
                  </div>

                  {/* Hotel Avatar - Larger with phase ring */}
                  <Avatar className={cn(
                    "h-10 w-10 shrink-0 ring-2 shadow-soft",
                    PHASE_RING_COLORS[hotel.phase] || "ring-border"
                  )}>
                    <AvatarImage src={hotel.logo_url || undefined} />
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {hotel.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Hotel Info */}
                  <div className="flex-1 min-w-0">
                    {/* Hotel name row */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate text-foreground">
                        {hotel.name}
                      </span>
                      {hotel.hasBlocker && (
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 animate-gentle-pulse" />
                      )}
                    </div>

                    {/* Status & metrics row */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Status badge - refined design */}
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium",
                        hotel.hasBlocker 
                          ? "bg-destructive/10 text-destructive" 
                          : "bg-emerald-500/10 text-emerald-600"
                      )}>
                        {hotel.hasBlocker ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        <span>{hotel.hasBlocker ? "Blocked" : "Healthy"}</span>
                      </div>

                      {/* Device count - show for all phases if > 0 */}
                      {hotel.dazeDeviceCount > 0 && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs text-muted-foreground bg-muted/60">
                          <Cpu className="h-3 w-3" />
                          <span className="font-medium">{hotel.dazeDeviceCount}</span>
                        </div>
                      )}

                      {/* ARR for contracted - new */}
                      {formattedARR && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs text-emerald-600 bg-emerald-500/10">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-semibold">{formattedARR}</span>
                        </div>
                      )}

                      {/* Days warning */}
                      {showDaysWarning && (
                        <span className="text-2xs font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                          {daysInPhase}d
                        </span>
                      )}
                    </div>

                    {/* Contact section - cleaner */}
                    {hotel.primaryContact && (
                      <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/40">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-2xs bg-muted font-medium text-muted-foreground">
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

// Overlay card shown while dragging - Static "Tactile Lift" effect
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
  const formattedARR = hotel.phase === "contracted" ? formatARR(hotel.arr) : null;

  // Static CSS-based lift effect - prevents double animation conflicts with dnd-kit
  return (
    <div
      className="transform scale-105 rotate-1"
      style={{ 
        transform: 'scale(1.05) rotate(1.5deg)',
        boxShadow: "0 25px 60px -12px hsl(199 89% 48% / 0.35), 0 12px 25px -8px hsl(0 0% 0% / 0.15)"
      }}
    >
      <Card
        className={cn(
          "cursor-grabbing shadow-2xl border",
          "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
          hotel.hasBlocker && "border-destructive/40 bg-destructive/5"
        )}
      >
        <CardContent className="p-3.5">
          <div className="flex items-start gap-3">
            {/* Drag Handle - Active state */}
            <div className="mt-1.5 text-primary">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Hotel Avatar */}
            <Avatar className={cn(
              "h-10 w-10 shrink-0 ring-2 shadow-soft",
              "ring-primary/40"
            )}>
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

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium",
                  hotel.hasBlocker 
                    ? "bg-destructive/10 text-destructive" 
                    : "bg-emerald-500/10 text-emerald-600"
                )}>
                  {hotel.hasBlocker ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  <span>{hotel.hasBlocker ? "Blocked" : "Healthy"}</span>
                </div>

                {hotel.dazeDeviceCount > 0 && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs text-muted-foreground bg-muted/60">
                    <Cpu className="h-3 w-3" />
                    <span className="font-medium">{hotel.dazeDeviceCount}</span>
                  </div>
                )}

                {formattedARR && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs text-emerald-600 bg-emerald-500/10">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-semibold">{formattedARR}</span>
                  </div>
                )}

                {showDaysWarning && (
                  <span className="text-2xs font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                    {daysInPhase}d
                  </span>
                )}
              </div>

              {hotel.primaryContact && (
                <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/40">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-2xs bg-muted font-medium text-muted-foreground">
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
    </div>
  );
}

// Re-export for backwards compatibility
export { DraggableHotelCard as HotelCard };
