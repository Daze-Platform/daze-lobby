import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  Tablet, 
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Plus,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { NewClientModal } from "@/components/modals/NewClientModal";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeVariant?: "default" | "destructive";
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface DashboardSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isMobile = false, onClose }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // Fetch clients count
  const { data: clientsCount } = useQuery({
    queryKey: ["clients-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch active blockers count
  const { data: blockersCount } = useQuery({
    queryKey: ["blockers-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("blocker_alerts")
        .select("*", { count: "exact", head: true })
        .is("resolved_at", null);
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch Daze devices count
  const { data: devicesCount } = useQuery({
    queryKey: ["devices-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("devices")
        .select("*", { count: "exact", head: true })
        .eq("is_daze_owned", true);
      if (error) throw error;
      return count || 0;
    },
  });

  const navGroups: NavGroup[] = [
    {
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "CLIENTS",
      items: [
        {
          title: "Clients",
          href: "/clients",
          icon: Users,
          badge: clientsCount ?? undefined,
        },
        {
          title: "Incomplete",
          href: "/blockers",
          icon: AlertTriangle,
          badge: blockersCount ?? undefined,
          badgeVariant: "destructive",
        },
      ],
    },
    {
      label: "OPERATIONS",
      items: [
        {
          title: "Devices",
          href: "/devices",
          icon: Tablet,
          badge: devicesCount ?? undefined,
        },
      ],
    },
    {
      label: "PREVIEW",
      items: [
        {
          title: "Client Portal",
          href: "/portal-preview",
          icon: Eye,
        },
      ],
    },
  ];

  // On mobile, always show full width, no collapse
  const showCollapsed = !isMobile && isCollapsed;

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside 
      className={cn(
        "relative flex flex-col h-full bg-card border-r border-border/40 transition-all duration-300 ease-out",
        isMobile ? "w-full" : (showCollapsed ? "w-[68px]" : "w-60")
      )}
    >
      {/* Mobile close button */}
      {isMobile && onClose && (
        <div className="flex items-center justify-end p-3 border-b border-border/40">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
      )}

      {/* Collapse Toggle - only on desktop */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-card shadow-soft",
            "hover:bg-muted transition-all hover:scale-110"
          )}
        >
          {showCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      )}

      {/* New Client Button */}
      <div className={cn("px-3 pt-4", showCollapsed && "px-2")}>
        <Button
          onClick={() => setIsNewClientOpen(true)}
          className={cn(
            "w-full gap-2 shadow-soft",
            showCollapsed && "px-0"
          )}
          size={showCollapsed ? "icon" : "default"}
        >
          <Plus className="w-4 h-4" />
          {!showCollapsed && <span>New Client</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={cn(groupIndex > 0 && "mt-6")}>
            {/* Section label */}
            {group.label && !showCollapsed && (
              <div className="px-3 mb-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">
                  {group.label}
                </span>
              </div>
            )}
            
            {/* Section divider for collapsed state */}
            {group.label && showCollapsed && (
              <div className="px-2 mb-2">
                <div className="h-px bg-border/60" />
              </div>
            )}
            
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "group/nav relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px]",
                    "text-muted-foreground transition-all duration-200",
                    "hover:bg-muted/60 hover:text-foreground",
                    showCollapsed && "justify-center px-2"
                  )}
                  activeClassName={cn(
                    "bg-primary/10 text-primary",
                    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                    "before:w-[3px] before:h-5 before:rounded-full before:bg-primary"
                  )}
                >
                  {/* Icon with subtle background on hover */}
                  <div className={cn(
                    "flex items-center justify-center shrink-0 transition-all",
                    "group-hover/nav:-translate-y-0.5"
                  )}>
                    <item.icon 
                      className={cn(
                        "transition-colors",
                        showCollapsed ? "h-5 w-5" : "h-4 w-4"
                      )} 
                      strokeWidth={1.5} 
                    />
                  </div>
                  
                  {!showCollapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={cn(
                          "min-w-[22px] h-5 px-1.5 flex items-center justify-center",
                          "text-[10px] font-semibold rounded-full transition-transform",
                          "group-hover/nav:scale-105",
                          item.badgeVariant === "destructive"
                            ? "bg-destructive text-destructive-foreground animate-gentle-pulse"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Badge for collapsed state */}
                  {showCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
                      "flex items-center justify-center",
                      "text-[9px] font-bold rounded-full",
                      item.badgeVariant === "destructive"
                        ? "bg-destructive text-destructive-foreground animate-gentle-pulse"
                        : "bg-muted-foreground text-background"
                    )}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className={cn(
        "border-t border-border/40 p-3",
        showCollapsed && "flex justify-center"
      )}>
        {!showCollapsed && (
          <p className="text-[10px] text-muted-foreground/50 text-center font-medium tracking-wide">
            Daze Control Tower
          </p>
        )}
      </div>

      {/* New Client Modal */}
      <NewClientModal open={isNewClientOpen} onOpenChange={setIsNewClientOpen} />
    </aside>
  );
}
