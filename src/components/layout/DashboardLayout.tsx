import { ReactNode } from "react";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <DashboardHeader />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
