import { ReactNode, useState } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex flex-col bg-muted/30 overflow-hidden">
      <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex-1 flex min-h-0">
        {/* Mobile sidebar as Sheet */}
        {isMobile ? (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-64 p-0">
              <DashboardSidebar isMobile onClose={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        ) : (
          <DashboardSidebar />
        )}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
