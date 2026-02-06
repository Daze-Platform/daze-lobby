import { Draggable } from "@hello-pangea/dnd";
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
}

export function HotelCard({ hotel, index }: HotelCardProps) {
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
    <Draggable draggableId={hotel.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "group/card transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            // Default state
            "cursor-grab hover:shadow-soft-lg hover:-translate-y-0.5",
            // Blocker state
            hotel.hasBlocker && "border-destructive/50 border-2 bg-destructive/5",
            // Dragging state - lifted, rotated, glowing
            snapshot.isDragging && [
              "cursor-grabbing shadow-colored-lg rotate-2 scale-105 z-50",
              "ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
            ]
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              {/* Drag Handle */}
              <div 
                {...provided.dragHandleProps}
                className={cn(
                  "mt-1 text-muted-foreground/40 transition-all duration-200",
                  "group-hover/card:text-muted-foreground/70",
                  snapshot.isDragging && "text-primary"
                )}
              >
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Hotel Avatar */}
              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background shadow-soft">
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
      )}
    </Draggable>
  );
}
