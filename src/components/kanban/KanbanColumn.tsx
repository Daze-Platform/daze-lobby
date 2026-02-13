import { useDroppable } from "@dnd-kit/core";
import { DraggableHotelCard } from "./HotelCard";
import type { Client } from "@/hooks/useClients";
import type { Enums } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { RocketLaunch, Play, CheckCircle, type Icon as PhosphorIcon } from "@phosphor-icons/react";

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

const PHASE_ICONS: Record<Enums<"lifecycle_phase">, PhosphorIcon> = {
  onboarding: RocketLaunch,
  reviewing: RocketLaunch,
  pilot_live: Play,
  contracted: CheckCircle,
};

const PHASE_COLORS: Record<Enums<"lifecycle_phase">, { bg: string; border: string; icon: string }> = {
  onboarding: {
    bg: "bg-blue-500",
    border: "border-blue-500/30",
    icon: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  reviewing: {
    bg: "bg-purple-500",
    border: "border-purple-500/30",
    icon: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  },
  pilot_live: {
    bg: "bg-amber-500",
    border: "border-amber-500/30",
    icon: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  },
  contracted: {
    bg: "bg-emerald-500",
    border: "border-emerald-500/30",
    icon: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
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
    <div className="flex flex-col min-h-[350px] md:min-h-[400px]">
      {/* Column Header */}
      <div className="relative bg-card rounded-t-xl border border-b-0 border-border/50 overflow-hidden">
        {/* Top accent bar */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", colors.bg)} />
        
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 pt-3 sm:pt-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px]",
              colors.icon
            )}>
              <PhaseIcon size={16} weight="duotone" />
            </div>
            
            <div>
              <h3 className="font-semibold text-xs sm:text-sm tracking-tight">{title}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full bg-muted text-muted-foreground">
              {clients.length}
            </span>
            
            {blockerCount > 0 && (
              <span className="text-[10px] sm:text-xs font-semibold bg-destructive text-destructive-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {blockerCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Droppable Zone - columns are the only drop targets */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 sm:p-3 rounded-b-xl border border-t-0 transition-all duration-150",
          "bg-muted/30",
          isActive && "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
        )}
      >
        {/* No SortableContext - cards use useDraggable only */}
        <div className="space-y-2 sm:space-y-2.5">
          {clients.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-8 sm:py-12 text-center",
              "text-muted-foreground"
            )}>
              <PhaseIcon size={40} weight="duotone" className="opacity-20 mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm font-medium">
                {isActive ? "Drop here" : "No clients"}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-1 hidden sm:block">
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
