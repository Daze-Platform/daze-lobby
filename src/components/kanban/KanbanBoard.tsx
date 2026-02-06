import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { useHotels, useUpdateHotelPhase } from "@/hooks/useHotels";
import type { Enums } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS: {
  phase: Enums<"lifecycle_phase">;
  title: string;
  subtitle: string;
  accentColor: string;
}[] = [
  {
    phase: "onboarding",
    title: "Onboarding",
    subtitle: "Menu ingestion & setup",
    accentColor: "bg-blue-500/10 border-blue-500",
  },
  {
    phase: "pilot_live",
    title: "Pilot Live",
    subtitle: "Testing & adoption",
    accentColor: "bg-amber-500/10 border-amber-500",
  },
  {
    phase: "contracted",
    title: "Contracted",
    subtitle: "Revenue generation",
    accentColor: "bg-emerald-500/10 border-emerald-500",
  },
];

export function KanbanBoard() {
  const { data: hotels, isLoading, error } = useHotels();
  const updatePhase = useUpdateHotelPhase();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourcePhase = result.source.droppableId as Enums<"lifecycle_phase">;
    const destPhase = result.destination
      .droppableId as Enums<"lifecycle_phase">;

    if (sourcePhase === destPhase) return;

    updatePhase.mutate({
      hotelId: result.draggableId,
      newPhase: destPhase,
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.phase} className="min-w-[280px] max-w-[320px] flex-1">
            <Skeleton className="h-12 w-full rounded-t-lg" />
            <Skeleton className="h-[300px] w-full rounded-b-lg mt-0" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load hotels: {error.message}
      </div>
    );
  }

  const hotelsByPhase = COLUMNS.reduce(
    (acc, col) => {
      acc[col.phase] = (hotels || []).filter((h) => h.phase === col.phase);
      return acc;
    },
    {} as Record<Enums<"lifecycle_phase">, typeof hotels>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.phase}
            phase={col.phase}
            title={col.title}
            subtitle={col.subtitle}
            hotels={hotelsByPhase[col.phase] || []}
            accentColor={col.accentColor}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
