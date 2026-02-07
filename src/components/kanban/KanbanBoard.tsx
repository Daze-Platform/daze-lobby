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
import { LayoutGroup } from "framer-motion";
import { KanbanColumn } from "./KanbanColumn";
import { DraggableHotelCard, HotelCardOverlay } from "./HotelCard";
import { useClients, useUpdateClientPhase, type Client } from "@/hooks/useClients";
import { useBlockerDetails } from "@/hooks/useBlockerDetails";
import { BlockerResolutionModal, type BlockerData } from "@/components/modals/BlockerResolutionModal";
import { HotelDetailPanel } from "@/components/dashboard";
import type { Enums } from "@/integrations/supabase/types";
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
  const { data: clients, isLoading, error } = useClients();
  const updatePhase = useUpdateClientPhase();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPhase, setOverPhase] = useState<Enums<"lifecycle_phase"> | null>(null);
  
  // Track the last dropped card for "thud" animation
  const [lastDroppedId, setLastDroppedId] = useState<string | null>(null);
  
  // Screen reader announcements for accessibility
  const [announcement, setAnnouncement] = useState("");
  
  // Blocker modal state
  const [blockerModalOpen, setBlockerModalOpen] = useState(false);
  const [selectedBlockedClient, setSelectedBlockedClient] = useState<Client | null>(null);
  
  // Client detail panel state
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Fetch blocker details when a client is selected
  const { data: blockerDetails } = useBlockerDetails(selectedBlockedClient?.id || null);
  
  // Track card dimensions for ghost placeholder with caching
  const cardDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const dimensionsCacheRef = useRef<Map<string, { width: number; height: number }>>(new Map());
  
  // Handle click on blocked card
  const handleBlockedClick = useCallback((client: Client) => {
    setSelectedBlockedClient(client);
    setBlockerModalOpen(true);
  }, []);
  
  // Handle click on card to open detail panel
  const handleCardClick = useCallback((client: Client) => {
    setSelectedClient(client);
    setDetailPanelOpen(true);
  }, []);
  
  // Build blocker data for modal
  const blockerData: BlockerData | null = blockerDetails && selectedBlockedClient ? {
    id: blockerDetails.id,
    reason: blockerDetails.reason,
    blockerType: blockerDetails.blocker_type,
    autoRule: blockerDetails.auto_rule,
    createdAt: blockerDetails.created_at,
    clientId: selectedBlockedClient.id,
    clientName: selectedBlockedClient.name,
    clientPhase: selectedBlockedClient.phase,
  } : null;

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
    const client = clients?.find((c) => c.id === active.id);
    setActiveClient(client || null);
    
    // Set grabbing cursor on body for consistent feedback
    document.body.style.cursor = 'grabbing';
    
    // Screen reader announcement
    if (client) {
      setAnnouncement(`Picked up ${client.name}. Drop into a column to change phase.`);
    }
    
    // Capture card dimensions for ghost placeholder with caching
    const cachedDimensions = dimensionsCacheRef.current.get(active.id as string);
    if (cachedDimensions) {
      cardDimensionsRef.current = cachedDimensions;
    } else {
      const activeElement = document.querySelector(`[data-hotel-id="${active.id}"]`);
      if (activeElement) {
        const rect = activeElement.getBoundingClientRect();
        const dims = { width: rect.width, height: rect.height };
        dimensionsCacheRef.current.set(active.id as string, dims);
        cardDimensionsRef.current = dims;
      }
    }
  }, [clients]);

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
      const targetClient = clients?.find((c) => c.id === over.id);
      setOverPhase(targetClient?.phase || null);
    }
  }, [clients]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset cursor
    document.body.style.cursor = '';
    
    setActiveId(null);
    setActiveClient(null);
    setOverId(null);
    setOverPhase(null);
    cardDimensionsRef.current = null;

    if (!over) {
      setAnnouncement("Drop cancelled.");
      return;
    }

    const activeClientData = clients?.find((c) => c.id === active.id);
    if (!activeClientData) return;

    // Determine target phase from the over id
    let targetPhase: Enums<"lifecycle_phase"> | null = null;
    
    // Check if dropped on a column
    if (COLUMNS.some((col) => col.phase === over.id)) {
      targetPhase = over.id as Enums<"lifecycle_phase">;
    } else {
      // Dropped on another card - find which column that card is in
      const targetClient = clients?.find((c) => c.id === over.id);
      if (targetClient) {
        targetPhase = targetClient.phase;
      }
    }

    if (!targetPhase || targetPhase === activeClientData.phase) {
      setAnnouncement(`${activeClientData.name} returned to original position.`);
      return;
    }

    // Trigger "thud" animation on the dropped card
    setLastDroppedId(active.id as string);
    setTimeout(() => setLastDroppedId(null), 300);
    
    // Screen reader announcement
    const targetColumn = COLUMNS.find(c => c.phase === targetPhase);
    setAnnouncement(`${activeClientData.name} moved to ${targetColumn?.title || targetPhase}.`);

    // Trigger confetti for contracted phase
    if (targetPhase === "contracted") {
      setTimeout(triggerMiniConfetti, 200);
    }

    // Mutation now uses optimistic updates - UI updates instantly!
    updatePhase.mutate({
      clientId: active.id as string,
      newPhase: targetPhase,
    });
  }, [clients, updatePhase]);

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
        Failed to load clients: {error.message}
      </div>
    );
  }

  const clientsByPhase = COLUMNS.reduce(
    (acc, col) => {
      acc[col.phase] = (clients || []).filter((c) => c.phase === col.phase);
      return acc;
    },
    {} as Record<Enums<"lifecycle_phase">, Client[]>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* LayoutGroup enables smooth cross-column layoutId animations */}
      <LayoutGroup>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-snap-x scrollbar-hide">
          {COLUMNS.map((col) => {
          const columnClients = clientsByPhase[col.phase] || [];
          const isOver = overId === col.phase || columnClients.some((c) => c.id === overId);
          // Show ghost when hovering over a DIFFERENT column than the card's origin
          const showGhost = overPhase === col.phase && activeClient && activeClient.phase !== col.phase;
          
          return (
            <SortableContext
              key={col.phase}
              items={columnClients.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                phase={col.phase}
                title={col.title}
                subtitle={col.subtitle}
                hotels={columnClients}
                accentColor={col.accentColor}
                isOver={isOver}
                activeId={activeId}
                showGhost={showGhost}
                ghostDimensions={cardDimensionsRef.current}
                lastDroppedId={lastDroppedId}
                onBlockedClick={handleBlockedClick}
                onCardClick={handleCardClick}
              />
            </SortableContext>
            );
          })}
        </div>
      </LayoutGroup>

      {/* Drag Overlay - Instant snap with no drop animation for crisp UX */}
      <DragOverlay dropAnimation={null}>
        {activeClient ? (
          <HotelCardOverlay hotel={activeClient} />
        ) : null}
      </DragOverlay>
      
      {/* Screen reader live region for accessibility */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Blocker Resolution Modal */}
      <BlockerResolutionModal
        open={blockerModalOpen}
        onOpenChange={setBlockerModalOpen}
        blocker={blockerData}
        onBlockerCleared={() => setSelectedBlockedClient(null)}
      />
      
      {/* Client Detail Panel */}
      <HotelDetailPanel
        hotel={selectedClient}
        open={detailPanelOpen}
        onOpenChange={setDetailPanelOpen}
      />
    </DndContext>
  );
}
