import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Cpu } from "lucide-react";
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
          {...provided.dragHandleProps}
          className={cn(
            "mb-2 cursor-grab active:cursor-grabbing transition-all",
            hotel.hasBlocker && "border-destructive border-2",
            snapshot.isDragging && "shadow-lg rotate-2 scale-105"
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={hotel.logo_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {hotel.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">
                    {hotel.name}
                  </span>
                  {hotel.hasBlocker && (
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={hotel.hasBlocker ? "destructive" : "secondary"}
                    className="text-2xs"
                  >
                    {hotel.hasBlocker ? "Blocked" : "Healthy"}
                  </Badge>

                  {hotel.phase === "pilot_live" && hotel.deviceCount > 0 && (
                    <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                      <Cpu className="h-3 w-3" />
                      <span>
                        {hotel.onlineDeviceCount}/{hotel.deviceCount}
                      </span>
                    </div>
                  )}

                  {showDaysWarning && (
                    <span className="text-2xs text-warning">
                      {daysInPhase}d
                    </span>
                  )}
                </div>

                {hotel.primaryContact && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-2xs bg-muted">
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
