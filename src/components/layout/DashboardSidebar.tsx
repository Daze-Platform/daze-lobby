import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  Tablet, 
  DollarSign,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch clients count
  const { data: clientsCount } = useQuery({
    queryKey: ["clients-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("hotels")
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

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Clients",
      href: "/clients",
      icon: Users,
      badge: clientsCount ?? undefined,
    },
    {
      title: "Blockers",
      href: "/blockers",
      icon: AlertTriangle,
      badge: blockersCount ?? undefined,
    },
    {
      title: "Devices",
      href: "/devices",
      icon: Tablet,
      badge: devicesCount ?? undefined,
    },
    {
      title: "Revenue",
      href: "/revenue",
      icon: DollarSign,
    },
  ];

  return (
    <aside 
      className={cn(
        "relative flex flex-col h-full bg-background border-r border-border/50 transition-all duration-300 ease-out",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-soft",
          "hover:bg-muted transition-colors"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
              "text-muted-foreground transition-all duration-200",
              "hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-soft",
              isCollapsed && "justify-center px-2"
            )}
            activeClassName="bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9]/15 shadow-soft"
          >
            <item.icon 
              className={cn(
                "shrink-0 transition-colors",
                isCollapsed ? "h-5 w-5" : "h-4 w-4"
              )} 
              strokeWidth={1.5} 
            />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn(
                    "min-w-[20px] h-5 px-1.5 flex items-center justify-center",
                    "text-2xs font-semibold rounded-full",
                    item.title === "Blockers" 
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section - can add user info or settings here */}
      <div className={cn(
        "border-t border-border/50 p-3",
        isCollapsed && "flex justify-center"
      )}>
        {!isCollapsed && (
          <p className="text-2xs text-muted-foreground/60 text-center">
            Daze Control Tower
          </p>
        )}
      </div>
    </aside>
  );
}
