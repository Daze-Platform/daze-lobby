import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Cpu, GripVertical } from "lucide-react";
import type { Hotel } from "@/hooks/useHotels";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

interface HotelCardProps {
  hotel: Hotel;
  index: number;
  isDragging?: boolean;
}

// Spring physics config
const springTransition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
};

export function DraggableHotelCard({ hotel, index, isDragging = false }: HotelCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: hotel.id,
    transition: {
      duration: 300,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

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
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      layoutId={hotel.id}
      initial={false}
      animate={{
        opacity: isBeingDragged ? 0.5 : 1,
        scale: 1,
      }}
      transition={springTransition}
    >
      <Card
        className={cn(
          "group/card transition-shadow duration-200",
          "cursor-grab hover:shadow-soft-lg active:cursor-grabbing",
          hotel.hasBlocker && "border-destructive/50 border-2 bg-destructive/5",
          isBeingDragged && "opacity-50"
        )}
        {...attributes}
        {...listeners}
      >
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Drag Handle */}
            <div className="mt-1 text-muted-foreground/40 group-hover/card:text-muted-foreground/70 transition-colors flex-shrink-0">
              <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

                {hotel.phase === "pilot_live" && hotel.deviceCount > 0 && (
                  <div className="flex items-center gap-1 text-2xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    <Cpu className="h-3 w-3" />
                    <span className="font-medium">
                      {hotel.onlineDeviceCount}/{hotel.deviceCount}
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
      initial={{ scale: 1, rotate: 0 }}
      animate={{ 
        scale: 1.05, 
        rotate: 3,
      }}
      transition={springTransition}
    >
      <Card
        className={cn(
          "cursor-grabbing shadow-2xl",
          "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
          "shadow-[0_25px_50px_-12px_hsl(var(--primary)/0.25)]",
          hotel.hasBlocker && "border-destructive/50 border-2 bg-destructive/5"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Drag Handle - Active state */}
            <div className="mt-1 text-primary">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Hotel Avatar */}
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/30 shadow-soft">
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

                {hotel.phase === "pilot_live" && hotel.deviceCount > 0 && (
                  <div className="flex items-center gap-1 text-2xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    <Cpu className="h-3 w-3" />
                    <span className="font-medium">
                      {hotel.onlineDeviceCount}/{hotel.deviceCount}
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
