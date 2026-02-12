import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const useSidebarSheet = useIsMobileOrTablet();

  return (
    <div className="h-screen flex flex-col bg-muted/30 dark:bg-background overflow-hidden">
      <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} showMenuButton={useSidebarSheet} />
      <div className="flex-1 flex min-h-0">
        {useSidebarSheet ? (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-64 p-0">
              <DashboardSidebar isMobile onClose={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        ) : (
          <DashboardSidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(prev => !prev)} />
        )}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
