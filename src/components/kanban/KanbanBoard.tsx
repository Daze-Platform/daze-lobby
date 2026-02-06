import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { DraggableHotelCard, HotelCardOverlay } from "./HotelCard";
import { useHotels, useUpdateHotelPhase } from "@/hooks/useHotels";
import type { Enums } from "@/integrations/supabase/types";
import type { Hotel } from "@/hooks/useHotels";
import { Skeleton } from "@/components/ui/skeleton";
import confetti from "canvas-confetti";

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

// Mini confetti burst for success
function triggerMiniConfetti() {
  const defaults = {
    spread: 60,
    ticks: 50,
    gravity: 1.2,
    decay: 0.94,
    startVelocity: 20,
    colors: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
  };

  confetti({
    ...defaults,
    particleCount: 30,
    origin: { x: 0.5, y: 0.5 },
    scalar: 0.8,
  });
}

export function KanbanBoard() {
  const { data: hotels, isLoading, error } = useHotels();
  const updatePhase = useUpdateHotelPhase();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeHotel, setActiveHotel] = useState<Hotel | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPhase, setOverPhase] = useState<Enums<"lifecycle_phase"> | null>(null);
  
  // Track card dimensions for ghost placeholder
  const cardDimensionsRef = useRef<{ width: number; height: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const hotel = hotels?.find((h) => h.id === active.id);
    setActiveHotel(hotel || null);
    
    // Capture card dimensions for ghost placeholder
    const activeElement = document.querySelector(`[data-hotel-id="${active.id}"]`);
    if (activeElement) {
      const rect = activeElement.getBoundingClientRect();
      cardDimensionsRef.current = { width: rect.width, height: rect.height };
    }
  }, [hotels]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
    
    // Determine which phase/column we're hovering over
    if (!over) {
      setOverPhase(null);
      return;
    }
    
    // Check if over a column directly
    if (COLUMNS.some((col) => col.phase === over.id)) {
      setOverPhase(over.id as Enums<"lifecycle_phase">);
    } else {
      // Over a card - find its column
      const targetHotel = hotels?.find((h) => h.id === over.id);
      setOverPhase(targetHotel?.phase || null);
    }
  }, [hotels]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveHotel(null);
    setOverId(null);
    setOverPhase(null);
    cardDimensionsRef.current = null;

    if (!over) return;

    const activeHotelData = hotels?.find((h) => h.id === active.id);
    if (!activeHotelData) return;

    // Determine target phase from the over id
    let targetPhase: Enums<"lifecycle_phase"> | null = null;
    
    // Check if dropped on a column
    if (COLUMNS.some((col) => col.phase === over.id)) {
      targetPhase = over.id as Enums<"lifecycle_phase">;
    } else {
      // Dropped on another card - find which column that card is in
      const targetHotel = hotels?.find((h) => h.id === over.id);
      if (targetHotel) {
        targetPhase = targetHotel.phase;
      }
    }

    if (!targetPhase || targetPhase === activeHotelData.phase) return;

    // Trigger confetti for contracted phase
    if (targetPhase === "contracted") {
      setTimeout(triggerMiniConfetti, 200);
    }

    // Mutation now uses optimistic updates - UI updates instantly!
    updatePhase.mutate({
      hotelId: active.id as string,
      newPhase: targetPhase,
    });
  }, [hotels, updatePhase]);

  if (isLoading) {
    return (
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-snap-x scrollbar-hide">
        {COLUMNS.map((col) => (
          <div key={col.phase} className="min-w-[260px] sm:min-w-[280px] max-w-[320px] flex-shrink-0 lg:flex-shrink lg:flex-1 scroll-snap-start">
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
    {} as Record<Enums<"lifecycle_phase">, Hotel[]>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-snap-x scrollbar-hide">
        {COLUMNS.map((col) => {
          const columnHotels = hotelsByPhase[col.phase] || [];
          const isOver = overId === col.phase || columnHotels.some((h) => h.id === overId);
          // Show ghost when hovering over a DIFFERENT column than the card's origin
          const showGhost = overPhase === col.phase && activeHotel && activeHotel.phase !== col.phase;
          
          return (
            <SortableContext
              key={col.phase}
              items={columnHotels.map((h) => h.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                phase={col.phase}
                title={col.title}
                subtitle={col.subtitle}
                hotels={columnHotels}
                accentColor={col.accentColor}
                isOver={isOver}
                activeId={activeId}
                showGhost={showGhost}
                ghostDimensions={cardDimensionsRef.current}
              />
            </SortableContext>
          );
        })}
      </div>

      {/* Drag Overlay - The floating card with high-stiffness spring */}
      <DragOverlay dropAnimation={{
        duration: 250,
        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.12)",
      }}>
        {activeHotel ? (
          <HotelCardOverlay hotel={activeHotel} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
