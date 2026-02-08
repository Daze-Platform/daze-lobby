import { useDroppable } from "@dnd-kit/core";
import { DraggableHotelCard } from "./HotelCard";
import type { Client } from "@/hooks/useClients";
import type { Enums } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { Rocket, Play, CheckCircle2, type LucideIcon } from "lucide-react";

interface KanbanColumnProps {
  phase: Enums<"lifecycle_phase">;
  title: string;
  subtitle: string;
  clients: Client[];
  isOver?: boolean;
  activeId?: string | null;
  onBlockedClick?: (client: Client) => void;
  onCardClick?: (client: Client) => void;
}

const PHASE_ICONS: Record<Enums<"lifecycle_phase">, LucideIcon> = {
  onboarding: Rocket,
  reviewing: Rocket,
  pilot_live: Play,
  contracted: CheckCircle2,
};

const PHASE_COLORS: Record<Enums<"lifecycle_phase">, { bg: string; border: string; icon: string }> = {
  onboarding: {
    bg: "bg-blue-500",
    border: "border-blue-500/30",
    icon: "bg-blue-500/10 text-blue-600",
  },
  reviewing: {
    bg: "bg-purple-500",
    border: "border-purple-500/30",
    icon: "bg-purple-500/10 text-purple-600",
  },
  pilot_live: {
    bg: "bg-amber-500",
    border: "border-amber-500/30",
    icon: "bg-amber-500/10 text-amber-600",
  },
  contracted: {
    bg: "bg-emerald-500",
    border: "border-emerald-500/30",
    icon: "bg-emerald-500/10 text-emerald-600",
  },
};

export function KanbanColumn({
  phase,
  title,
  subtitle,
  clients,
  isOver = false,
  activeId,
  onBlockedClick,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id: phase });
  
  const blockerCount = clients.filter((c) => c.hasBlocker).length;
  const isActive = isOver || isDroppableOver;
  const PhaseIcon = PHASE_ICONS[phase];
  const colors = PHASE_COLORS[phase];

  return (
    <div className="flex flex-col min-h-[400px]">
      {/* Column Header */}
      <div className="relative bg-card rounded-t-xl border border-b-0 border-border/50 overflow-hidden">
        {/* Top accent bar */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", colors.bg)} />
        
        <div className="flex items-center justify-between px-4 py-3 pt-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-9 h-9 rounded-[10px]",
              colors.icon
            )}>
              <PhaseIcon className="h-4 w-4" strokeWidth={1.5} />
            </div>
            
            <div>
              <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {clients.length}
            </span>
            
            {blockerCount > 0 && (
              <span className="text-xs font-semibold bg-destructive text-destructive-foreground px-2 py-1 rounded-full">
                {blockerCount} blocked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Droppable Zone - columns are the only drop targets */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 rounded-b-xl border border-t-0 transition-all duration-200",
          "bg-muted/30",
          isActive && "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
        )}
      >
        {/* No SortableContext - cards use useDraggable only */}
        <div className="space-y-2.5">
          {clients.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-12 text-center",
              "text-muted-foreground"
            )}>
              <PhaseIcon className="h-10 w-10 opacity-20 mb-3" strokeWidth={1} />
              <p className="text-sm font-medium">
                {isActive ? "Drop here" : "No clients"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {isActive ? "Release to move" : `Drag clients to ${title.toLowerCase()}`}
              </p>
            </div>
          ) : (
            clients.map((client) => (
              <DraggableHotelCard
                key={client.id}
                hotel={client}
                isDragging={activeId === client.id}
                onBlockedClick={onBlockedClick}
                onCardClick={onCardClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
