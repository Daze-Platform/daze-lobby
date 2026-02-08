import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { HotelCardOverlay } from "./HotelCard";
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
}[] = [
  {
    phase: "onboarding",
    title: "Onboarding",
    subtitle: "Menu ingestion & setup",
  },
  {
    phase: "pilot_live",
    title: "Pilot Live",
    subtitle: "Testing & adoption",
  },
  {
    phase: "contracted",
    title: "Contracted",
    subtitle: "Revenue generation",
  },
];

function triggerMiniConfetti() {
  confetti({
    spread: 60,
    ticks: 50,
    gravity: 1.2,
    decay: 0.94,
    startVelocity: 20,
    colors: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
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
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  
  // Blocker modal state
  const [blockerModalOpen, setBlockerModalOpen] = useState(false);
  const [selectedBlockedClient, setSelectedBlockedClient] = useState<Client | null>(null);
  
  // Client detail panel state
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const { data: blockerDetails } = useBlockerDetails(selectedBlockedClient?.id || null);
  
  const handleBlockedClick = useCallback((client: Client) => {
    setSelectedBlockedClient(client);
    setBlockerModalOpen(true);
  }, []);
  
  const handleCardClick = useCallback((client: Client) => {
    setSelectedClient(client);
    setDetailPanelOpen(true);
  }, []);
  
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
        distance: 10,
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
    document.body.style.cursor = 'grabbing';
  }, [clients]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }
    
    // Check if over a column directly
    const columnPhase = COLUMNS.find((col) => col.phase === over.id)?.phase;
    if (columnPhase) {
      setOverColumnId(columnPhase);
    } else {
      // Over a card - find its column
      const targetClient = clients?.find((c) => c.id === over.id);
      setOverColumnId(targetClient?.phase || null);
    }
  }, [clients]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    document.body.style.cursor = '';
    setActiveId(null);
    setActiveClient(null);
    setOverColumnId(null);

    if (!over) return;

    const activeClientData = clients?.find((c) => c.id === active.id);
    if (!activeClientData) return;

    // Determine target phase
    let targetPhase: Enums<"lifecycle_phase"> | null = null;
    
    if (COLUMNS.some((col) => col.phase === over.id)) {
      targetPhase = over.id as Enums<"lifecycle_phase">;
    } else {
      const targetClient = clients?.find((c) => c.id === over.id);
      if (targetClient) {
        targetPhase = targetClient.phase;
      }
    }

    if (!targetPhase || targetPhase === activeClientData.phase) return;

    if (targetPhase === "contracted") {
      setTimeout(triggerMiniConfetti, 200);
    }

    updatePhase.mutate({
      clientId: active.id as string,
      newPhase: targetPhase,
    });
  }, [clients, updatePhase]);

  const handleDragCancel = useCallback(() => {
    document.body.style.cursor = '';
    setActiveId(null);
    setActiveClient(null);
    setOverColumnId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.phase} className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-[320px] w-full rounded-xl" />
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const columnClients = clientsByPhase[col.phase] || [];
          const isOver = overColumnId === col.phase && activeClient?.phase !== col.phase;
          
          return (
            <KanbanColumn
              key={col.phase}
              phase={col.phase}
              title={col.title}
              subtitle={col.subtitle}
              clients={columnClients}
              isOver={isOver}
              activeId={activeId}
              onBlockedClick={handleBlockedClick}
              onCardClick={handleCardClick}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeClient ? <HotelCardOverlay hotel={activeClient} /> : null}
      </DragOverlay>

      <BlockerResolutionModal
        open={blockerModalOpen}
        onOpenChange={setBlockerModalOpen}
        blocker={blockerData}
        onBlockerCleared={() => setSelectedBlockedClient(null)}
      />
      
      <HotelDetailPanel
        hotel={selectedClient}
        open={detailPanelOpen}
        onOpenChange={setDetailPanelOpen}
      />
    </DndContext>
  );
}