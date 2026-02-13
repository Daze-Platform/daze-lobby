import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { HotelCardOverlay } from "./HotelCard";
import { useClients, useUpdateClientPhase, type Client } from "@/hooks/useClients";
import { useBlockerDetails } from "@/hooks/useBlockerDetails";
import { BlockerResolutionModal, type BlockerData } from "@/components/modals/BlockerResolutionModal";
import { HotelDetailPanel } from "@/components/dashboard";
import type { Enums } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import confetti from "canvas-confetti";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PHASE_ORDER: Record<Enums<"lifecycle_phase">, number> = {
  onboarding: 0,
  reviewing: 1,
  pilot_live: 2,
  contracted: 3,
};

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
    phase: "reviewing",
    title: "In Review",
    subtitle: "Pending approval",
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

const PHASE_LABELS: Record<Enums<"lifecycle_phase">, string> = {
  onboarding: "Onboarding",
  reviewing: "In Review",
  pilot_live: "Pilot Live",
  contracted: "Contracted",
};

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
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const useHorizontalScroll = isMobile || isTablet;
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  
  // Backward move warning state
  const [pendingBackwardMove, setPendingBackwardMove] = useState<{
    clientId: string;
    clientName: string;
    fromPhase: Enums<"lifecycle_phase">;
    toPhase: Enums<"lifecycle_phase">;
  } | null>(null);
  const [backwardWarningOpen, setBackwardWarningOpen] = useState(false);
  
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
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const client = clients?.find((c) => c.id === active.id);
    setActiveClient(client || null);
    document.body.style.cursor = 'grabbing';
    if (navigator.vibrate) navigator.vibrate(15);
  }, [clients]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }
    
    const columnPhase = COLUMNS.find((col) => col.phase === over.id)?.phase;
    if (columnPhase && columnPhase !== overColumnId) {
      if (navigator.vibrate) navigator.vibrate(10);
    }
    setOverColumnId(columnPhase || null);
  }, [overColumnId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    document.body.style.cursor = '';
    setActiveId(null);
    setActiveClient(null);
    setOverColumnId(null);

    if (!over) return;

    const activeClientData = clients?.find((c) => c.id === active.id);
    if (!activeClientData) return;

    const targetPhase = over.id as Enums<"lifecycle_phase">;
    
    if (!COLUMNS.some((col) => col.phase === targetPhase)) return;
    if (targetPhase === activeClientData.phase) return;

    // Backward move detection
    if (PHASE_ORDER[targetPhase] < PHASE_ORDER[activeClientData.phase]) {
      setPendingBackwardMove({
        clientId: active.id as string,
        clientName: activeClientData.name,
        fromPhase: activeClientData.phase,
        toPhase: targetPhase,
      });
      setBackwardWarningOpen(true);
      return;
    }

    if (targetPhase === "contracted") {
      setTimeout(triggerMiniConfetti, 200);
    }

    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    updatePhase.mutate({
      clientId: active.id as string,
      newPhase: targetPhase,
    });
  }, [clients, updatePhase]);

  const handleConfirmBackwardMove = useCallback(() => {
    if (!pendingBackwardMove) return;
    updatePhase.mutate({
      clientId: pendingBackwardMove.clientId,
      newPhase: pendingBackwardMove.toPhase,
    });
    setPendingBackwardMove(null);
    setBackwardWarningOpen(false);
  }, [pendingBackwardMove, updatePhase]);

  const handleCancelBackwardMove = useCallback(() => {
    setPendingBackwardMove(null);
    setBackwardWarningOpen(false);
  }, []);

  const handleDragCancel = useCallback(() => {
    document.body.style.cursor = '';
    setActiveId(null);
    setActiveClient(null);
    setOverColumnId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-4">
        <div className="flex gap-4 lg:grid lg:grid-cols-4" style={{ minWidth: useHorizontalScroll ? 'max-content' : undefined }}>
          {COLUMNS.map((col) => (
            <div key={col.phase} className="min-w-[280px] sm:min-w-[300px] lg:min-w-0 space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-[320px] w-full rounded-xl" />
            </div>
          ))}
        </div>
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
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Horizontal scroll on mobile/tablet with snap points */}
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-4 lg:pb-0 snap-x snap-mandatory lg:snap-none">
        <div 
          className="flex gap-4 lg:grid lg:grid-cols-4" 
          style={{ minWidth: useHorizontalScroll ? 'max-content' : undefined }}
        >
          {COLUMNS.map((col) => {
            const columnClients = clientsByPhase[col.phase] || [];
            const isOver = overColumnId === col.phase && activeClient?.phase !== col.phase;
            
            return (
              <div key={col.phase} className="snap-center lg:snap-align-none min-w-[280px] sm:min-w-[300px] lg:min-w-0">
                <KanbanColumn
                  phase={col.phase}
                  title={col.title}
                  subtitle={col.subtitle}
                  clients={columnClients}
                  isOver={isOver}
                  activeId={activeId}
                  onBlockedClick={handleBlockedClick}
                  onCardClick={handleCardClick}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Portal DragOverlay to document.body to avoid transform offset issues */}
      {createPortal(
        <DragOverlay 
          dropAnimation={{
            duration: 150,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          style={{ zIndex: 9999 }}
        >
          {activeClient ? <HotelCardOverlay hotel={activeClient} /> : null}
        </DragOverlay>,
        document.body
      )}

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

      <AlertDialog open={backwardWarningOpen} onOpenChange={setBackwardWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move client backward?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to move <strong>{pendingBackwardMove?.clientName}</strong> from{" "}
              <strong>{pendingBackwardMove ? PHASE_LABELS[pendingBackwardMove.fromPhase] : ""}</strong> back to{" "}
              <strong>{pendingBackwardMove ? PHASE_LABELS[pendingBackwardMove.toPhase] : ""}</strong>.
              This is an unusual action. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelBackwardMove}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBackwardMove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Move backward
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
