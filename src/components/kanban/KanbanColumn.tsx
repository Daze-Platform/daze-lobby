import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { DraggableHotelCard } from "./HotelCard";
import type { Hotel } from "@/hooks/useHotels";
import type { Enums } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { Rocket, Play, CheckCircle2, Plus, type LucideIcon } from "lucide-react";

interface KanbanColumnProps {
  phase: Enums<"lifecycle_phase">;
  title: string;
  subtitle: string;
  hotels: Hotel[];
  accentColor: string;
  isOver?: boolean;
  activeId?: string | null;
  showGhost?: boolean;
  ghostDimensions?: { width: number; height: number } | null;
  onBlockedClick?: (hotel: Hotel) => void;
  onCardClick?: (hotel: Hotel) => void;
}

// Phase icon mapping
const PHASE_ICONS: Record<Enums<"lifecycle_phase">, LucideIcon> = {
  onboarding: Rocket,
  reviewing: Rocket,
  pilot_live: Play,
  contracted: CheckCircle2,
};

// Phase accent colors for icon containers
const PHASE_ICON_COLORS: Record<Enums<"lifecycle_phase">, string> = {
  onboarding: "bg-blue-500/15 text-blue-600",
  reviewing: "bg-purple-500/15 text-purple-600",
  pilot_live: "bg-amber-500/15 text-amber-600",
  contracted: "bg-emerald-500/15 text-emerald-600",
};

// Phase border colors
const PHASE_BORDER_COLORS: Record<Enums<"lifecycle_phase">, string> = {
  onboarding: "border-blue-500",
  reviewing: "border-purple-500",
  pilot_live: "border-amber-500",
  contracted: "border-emerald-500",
};

// High-stiffness spring for snappy animations
const snapSpring = {
  type: "spring" as const,
  stiffness: 600,
  damping: 30,
};

export function KanbanColumn({
  phase,
  title,
  subtitle,
  hotels,
  accentColor,
  isOver = false,
  activeId,
  showGhost = false,
  ghostDimensions,
  onBlockedClick,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: phase,
  });

  const blockerCount = hotels.filter((h) => h.hasBlocker).length;
  const isActive = isOver || isDroppableOver;
  
  const PhaseIcon = PHASE_ICONS[phase];

  return (
    <div className="flex flex-col min-w-[280px] sm:min-w-[300px] max-w-[340px] flex-shrink-0 lg:flex-shrink lg:flex-1 lg:max-w-none group/column scroll-snap-start">
      {/* Column Header - Refined design */}
      <div className="relative bg-card rounded-t-xl shadow-soft overflow-hidden">
        {/* Top accent bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          PHASE_BORDER_COLORS[phase].replace("border-", "bg-")
        )} />
        
        <div className="flex items-center justify-between px-4 py-3.5 pt-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Phase icon in squircle container */}
            <div className={cn(
              "flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0",
              PHASE_ICON_COLORS[phase]
            )}>
              <PhaseIcon className="h-4.5 w-4.5" strokeWidth={1.5} />
            </div>
            
            <div className="min-w-0">
              <h3 className="font-semibold text-sm tracking-tight text-foreground">{title}</h3>
              <p className="text-2xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Hotel count pill */}
            <span className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              "bg-muted/80 text-muted-foreground"
            )}>
              {hotels.length}
            </span>
            
            {/* Blocker count badge */}
            {blockerCount > 0 && (
              <span className="text-2xs font-semibold bg-destructive text-destructive-foreground px-2 py-1 rounded-full animate-gentle-pulse">
                {blockerCount} blocked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Droppable Zone - Magnetic effect with border flash */}
      <motion.div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 rounded-b-xl min-h-[280px] border border-t-0",
          "bg-muted/30 border-border/50"
        )}
        animate={{
          backgroundColor: isActive 
            ? "hsl(217 91% 60% / 0.06)" 
            : "hsl(220 14% 96% / 0.3)",
          borderColor: isActive 
            ? "hsl(199 89% 48% / 0.5)" 
            : "hsl(220 13% 91% / 0.5)",
          boxShadow: isActive 
            ? "0 0 30px -5px hsl(199 89% 48% / 0.25), inset 0 0 20px -10px hsl(199 89% 48% / 0.1)" 
            : "none",
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <AnimatePresence mode="popLayout">
          {hotels.length === 0 && !showGhost ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-8"
            >
              {/* Icon stack for empty state */}
              <div className="relative">
                {/* Large faint background icon */}
                <PhaseIcon 
                  className={cn(
                    "h-16 w-16 opacity-10",
                    isActive && "opacity-20"
                  )} 
                  strokeWidth={1} 
                />
                {/* Small overlay icon */}
                <motion.div
                  className={cn(
                    "absolute bottom-0 right-0 w-7 h-7 rounded-lg flex items-center justify-center",
                    "bg-background border-2 border-dashed shadow-soft",
                    isActive ? "border-primary" : "border-muted-foreground/30"
                  )}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    borderColor: isActive ? "hsl(199 89% 48%)" : "hsl(215 16% 47% / 0.3)",
                  }}
                  transition={snapSpring}
                >
                  <Plus className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-primary" : "text-muted-foreground/50"
                  )} />
                </motion.div>
              </div>
              
              <div className="text-center">
                <motion.p
                  className="text-sm font-medium"
                  animate={{
                    color: isActive ? "hsl(199 89% 48%)" : "hsl(215 16% 47%)",
                  }}
                >
                  {isActive ? "Drop here" : "No clients yet"}
                </motion.p>
                <p className="text-2xs text-muted-foreground/60 mt-0.5">
                  {isActive ? "Release to move" : `Drag clients to ${title.toLowerCase()}`}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-2.5"
              layout
              transition={snapSpring}
            >
              {/* Ghost Placeholder - Shows where card will land */}
              <AnimatePresence>
                {showGhost && ghostDimensions && (
                  <motion.div
                    key="ghost-placeholder"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ 
                      opacity: 1, 
                      height: ghostDimensions.height,
                    }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={snapSpring}
                    className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5"
                    style={{ width: "100%" }}
                  />
                )}
              </AnimatePresence>
              
              {hotels.map((hotel, index) => (
                <DraggableHotelCard 
                  key={hotel.id} 
                  hotel={hotel} 
                  index={index}
                  isDragging={activeId === hotel.id}
                  onBlockedClick={onBlockedClick}
                  onCardClick={onCardClick}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
