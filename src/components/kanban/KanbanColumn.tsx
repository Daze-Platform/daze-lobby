import { Droppable } from "@hello-pangea/dnd";
import { HotelCard } from "./HotelCard";
import type { Hotel } from "@/hooks/useHotels";
import type { Enums } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  phase: Enums<"lifecycle_phase">;
  title: string;
  subtitle: string;
  hotels: Hotel[];
  accentColor: string;
}

export function KanbanColumn({
  phase,
  title,
  subtitle,
  hotels,
  accentColor,
}: KanbanColumnProps) {
  const blockerCount = hotels.filter((h) => h.hasBlocker).length;

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1">
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-t-lg border-b-2",
          accentColor
        )}
      >
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-2xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium bg-background/80 px-2 py-0.5 rounded">
            {hotels.length}
          </span>
          {blockerCount > 0 && (
            <span className="text-2xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">
              {blockerCount} blocked
            </span>
          )}
        </div>
      </div>

      <Droppable droppableId={phase}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-2 rounded-b-lg border border-t-0 min-h-[200px] transition-colors",
              snapshot.isDraggingOver && "bg-accent/50"
            )}
          >
            {hotels.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No hotels
              </div>
            ) : (
              hotels.map((hotel, index) => (
                <HotelCard key={hotel.id} hotel={hotel} index={index} />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
