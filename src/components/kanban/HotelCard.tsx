import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, CheckCircle, Cpu, GripVertical, Lock, DollarSign } from "lucide-react";
import type { Client } from "@/hooks/useClients";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

interface HotelCardProps {
  hotel: Client;
  isDragging?: boolean;
  onBlockedClick?: (hotel: Client) => void;
  onCardClick?: (hotel: Client) => void;
}

const PHASE_RING_COLORS: Record<string, string> = {
  onboarding: "ring-blue-500/30",
  reviewing: "ring-purple-500/30",
  pilot_live: "ring-amber-500/30",
  contracted: "ring-emerald-500/30",
};

function formatARR(arr: number | null): string | null {
  if (!arr) return null;
  if (arr >= 1000) return `$${Math.round(arr / 1000)}K`;
  return `$${arr}`;
}

export const DraggableHotelCard = React.memo(function DraggableHotelCard({ 
  hotel, 
  isDragging = false, 
  onBlockedClick, 
  onCardClick 
}: HotelCardProps) {
  const [isShaking, setIsShaking] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging: isDraggableActive,
  } = useDraggable({
    id: hotel.id,
    disabled: hotel.hasBlocker,
  });

  const handleBlockedDragAttempt = React.useCallback(() => {
    if (hotel.hasBlocker) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  }, [hotel.hasBlocker]);

  const handleCardClick = React.useCallback((e: React.MouseEvent) => {
    if (hotel.hasBlocker && onBlockedClick) {
      e.stopPropagation();
      onBlockedClick(hotel);
    } else if (onCardClick) {
      e.stopPropagation();
      onCardClick(hotel);
    }
  }, [hotel, onBlockedClick, onCardClick]);

  const handleMouseDown = React.useCallback(() => {
    if (hotel.hasBlocker) {
      handleBlockedDragAttempt();
    }
  }, [hotel.hasBlocker, handleBlockedDragAttempt]);

  const daysInPhase = differenceInDays(new Date(), new Date(hotel.phase_started_at));
  const initials = hotel.primaryContact?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";
  const showDaysWarning = hotel.phase === "onboarding" && daysInPhase > 14;
  const formattedARR = hotel.phase === "contracted" ? formatARR(hotel.arr) : null;
  const isBeingDragged = isDragging || isDraggableActive;

  return (
    <div
      ref={setNodeRef}
      data-hotel-id={hotel.id}
      className={cn(
        isShaking && "animate-[shake_0.5s_ease-in-out]"
      )}
      style={{
        opacity: isBeingDragged ? 0 : 1,
        pointerEvents: isBeingDragged ? "none" : undefined,
      }}
    >
      <Card
        className={cn(
          "group/card transition-all duration-200 border",
          hotel.hasBlocker 
            ? "cursor-pointer border-destructive/30 bg-destructive/5 hover:border-destructive/50" 
            : "cursor-grab hover:shadow-md hover:border-border active:cursor-grabbing",
          isBeingDragged && "shadow-lg ring-2 ring-primary/30"
        )}
        onClick={handleCardClick}
        onMouseDown={handleMouseDown}
        {...(hotel.hasBlocker ? {} : { ...attributes, ...listeners })}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div className={cn(
              "mt-1 transition-colors flex-shrink-0",
              hotel.hasBlocker 
                ? "text-destructive/50" 
                : "text-muted-foreground/40 group-hover/card:text-muted-foreground"
            )}>
              {hotel.hasBlocker ? (
                <Lock className="h-4 w-4" />
              ) : (
                <GripVertical className="h-4 w-4" />
              )}
            </div>

            {/* Avatar */}
            <Avatar className={cn(
              "h-10 w-10 shrink-0 ring-2",
              PHASE_RING_COLORS[hotel.phase] || "ring-border"
            )}>
              <AvatarImage src={hotel.logo_url || undefined} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {hotel.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">
                  {hotel.name}
                </span>
                {hotel.hasBlocker && (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <div className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                  hotel.hasBlocker 
                    ? "bg-destructive/10 text-destructive" 
                    : "bg-emerald-500/10 text-emerald-600"
                )}>
                  {hotel.hasBlocker ? (
                    <AlertTriangle className="h-2.5 w-2.5" />
                  ) : (
                    <CheckCircle className="h-2.5 w-2.5" />
                  )}
                  <span>{hotel.hasBlocker ? "Blocked" : "Healthy"}</span>
                </div>

                {hotel.dazeDeviceCount > 0 && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-muted">
                    <Cpu className="h-2.5 w-2.5" />
                    <span>{hotel.dazeDeviceCount}</span>
                  </div>
                )}

                {formattedARR && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-emerald-600 bg-emerald-500/10">
                    <DollarSign className="h-2.5 w-2.5" />
                    <span className="font-semibold">{formattedARR}</span>
                  </div>
                )}

                {showDaysWarning && (
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {daysInPhase}d
                  </span>
                )}
              </div>

              {hotel.primaryContact && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px] bg-muted font-medium text-muted-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-muted-foreground truncate">
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
});

// Overlay card shown while dragging
export function HotelCardOverlay({ hotel }: { hotel: Client }) {
  const daysInPhase = differenceInDays(new Date(), new Date(hotel.phase_started_at));
  const initials = hotel.primaryContact?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";
  const showDaysWarning = hotel.phase === "onboarding" && daysInPhase > 14;
  const formattedARR = hotel.phase === "contracted" ? formatARR(hotel.arr) : null;

  return (
    <div
      style={{
        boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Card className="cursor-grabbing border ring-2 ring-primary/40 ring-offset-2 ring-offset-background">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 text-primary">
              <GripVertical className="h-4 w-4" />
            </div>

            <Avatar className={cn(
              "h-10 w-10 shrink-0 ring-2",
              PHASE_RING_COLORS[hotel.phase] || "ring-border"
            )}>
              <AvatarImage src={hotel.logo_url || undefined} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {hotel.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">{hotel.name}</span>
                {hotel.hasBlocker && (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <div className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                  hotel.hasBlocker 
                    ? "bg-destructive/10 text-destructive" 
                    : "bg-emerald-500/10 text-emerald-600"
                )}>
                  {hotel.hasBlocker ? (
                    <AlertTriangle className="h-2.5 w-2.5" />
                  ) : (
                    <CheckCircle className="h-2.5 w-2.5" />
                  )}
                  <span>{hotel.hasBlocker ? "Blocked" : "Healthy"}</span>
                </div>

                {hotel.dazeDeviceCount > 0 && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-muted">
                    <Cpu className="h-2.5 w-2.5" />
                    <span>{hotel.dazeDeviceCount}</span>
                  </div>
                )}

                {formattedARR && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-emerald-600 bg-emerald-500/10">
                    <DollarSign className="h-2.5 w-2.5" />
                    <span className="font-semibold">{formattedARR}</span>
                  </div>
                )}

                {showDaysWarning && (
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {daysInPhase}d
                  </span>
                )}
              </div>

              {hotel.primaryContact && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px] bg-muted font-medium text-muted-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-muted-foreground truncate">
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

export { DraggableHotelCard as HotelCard };
