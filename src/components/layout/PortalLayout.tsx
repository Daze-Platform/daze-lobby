import { ReactNode } from "react";

interface PortalLayoutProps {
  children: ReactNode;
}

/**
 * Minimalist layout wrapper for the client portal.
 * Unlike DashboardLayout, this has no sidebar - just the main content area.
 * The Portal.tsx page already contains its own header and navigation,
 * so this wrapper is intentionally minimal.
 */
export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      {children}
    </div>
  );
}
