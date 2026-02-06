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
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1 group/column">
      {/* Column Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-t-xl border-b-2 transition-all duration-200",
          accentColor
        )}
      >
        <div>
          <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
          <p className="text-2xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-soft">
            {hotels.length}
          </span>
          {blockerCount > 0 && (
            <span className="text-2xs font-medium bg-destructive text-destructive-foreground px-2 py-1 rounded-lg animate-gentle-pulse">
              {blockerCount} blocked
            </span>
          )}
        </div>
      </div>

      {/* Droppable Zone */}
      <Droppable droppableId={phase}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-3 rounded-b-xl border border-t-0 min-h-[240px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              // Default state
              "bg-muted/20",
              // Dragging over state - glow effect
              snapshot.isDraggingOver && [
                "bg-primary/10 border-primary/40",
                "ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
                "shadow-[0_0_30px_-5px_hsl(var(--primary)/0.25)]"
              ]
            )}
          >
            {hotels.length === 0 ? (
              <div 
                className={cn(
                  "flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2 transition-all duration-300",
                  snapshot.isDraggingOver && "text-primary scale-105"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center transition-all duration-300",
                  snapshot.isDraggingOver ? "border-primary bg-primary/10" : "border-muted-foreground/30"
                )}>
                  <span className="text-lg">+</span>
                </div>
                <span className="font-medium">
                  {snapshot.isDraggingOver ? "Drop here" : "No hotels"}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {hotels.map((hotel, index) => (
                  <HotelCard key={hotel.id} hotel={hotel} index={index} />
                ))}
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
