import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { DraggableHotelCard } from "./HotelCard";
import type { Hotel } from "@/hooks/useHotels";
import type { Enums } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

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
}

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
}: KanbanColumnProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: phase,
  });

  const blockerCount = hotels.filter((h) => h.hasBlocker).length;
  const isActive = isOver || isDroppableOver;

  return (
    <div className="flex flex-col min-w-[260px] sm:min-w-[280px] max-w-[320px] flex-shrink-0 lg:flex-shrink lg:flex-1 lg:max-w-none group/column scroll-snap-start">
      {/* Column Header */}
      <motion.div
        className={cn(
          "flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-xl border-b-2 transition-colors duration-200",
          accentColor
        )}
        animate={{
          scale: isActive ? 1.02 : 1,
        }}
        transition={snapSpring}
      >
        <div className="min-w-0">
          <h3 className="font-semibold text-sm tracking-tight truncate">{title}</h3>
          <p className="text-2xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <motion.span
            className="text-xs sm:text-sm font-semibold bg-background/90 backdrop-blur-sm px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg shadow-soft"
            animate={{
              scale: isActive ? 1.1 : 1,
            }}
            transition={snapSpring}
          >
            {hotels.length}
          </motion.span>
          {blockerCount > 0 && (
            <span className="text-2xs font-medium bg-destructive text-destructive-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg animate-gentle-pulse">
              {blockerCount} blocked
            </span>
          )}
        </div>
      </motion.div>

      {/* Droppable Zone - Magnetic effect with border flash */}
      <motion.div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 rounded-b-xl min-h-[240px] transition-all duration-150",
          "bg-muted/20"
        )}
        animate={{
          backgroundColor: isActive 
            ? "hsl(217 91% 60% / 0.08)" 
            : "hsl(214 32% 96% / 0.2)",
          // Border flash - Daze Ocean Blue (#0EA5E9 = hsl 199 89% 48%)
          borderColor: isActive 
            ? "hsl(199 89% 48%)" 
            : "hsl(214 32% 91%)",
          borderWidth: isActive ? "2px" : "1px",
          boxShadow: isActive 
            ? "0 0 30px -5px hsl(199 89% 48% / 0.35), inset 0 0 20px -10px hsl(199 89% 48% / 0.15)" 
            : "none",
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ borderStyle: "solid", borderTopWidth: 0 }}
      >
        <AnimatePresence mode="popLayout">
          {hotels.length === 0 && !showGhost ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2"
              )}
            >
              <motion.div
                className={cn(
                  "w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center",
                  isActive ? "border-primary bg-primary/10" : "border-muted-foreground/30"
                )}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  borderColor: isActive ? "hsl(199 89% 48%)" : "hsl(215 16% 47% / 0.3)",
                }}
                transition={snapSpring}
              >
                <span className="text-lg">+</span>
              </motion.div>
              <motion.span
                className="font-medium"
                animate={{
                  color: isActive ? "hsl(199 89% 48%)" : "hsl(215 16% 47%)",
                }}
              >
                {isActive ? "Drop here" : "No hotels"}
              </motion.span>
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-2"
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
                    className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5"
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
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
