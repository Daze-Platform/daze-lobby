import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Clock, ClipboardList, FileText } from "lucide-react";
import { AdminHotelSwitcher } from "./AdminHotelSwitcher";
import dazeLogo from "@/assets/daze-logo.png";

export type PortalView = "onboarding" | "documents";

interface PortalHeaderProps {
  activeView: PortalView;
  onViewChange: (view: PortalView) => void;
  isAdmin: boolean;
  isAdminViewing: boolean;
  userEmail?: string;
  onSignOut: () => void;
  onActivityFeedOpen: () => void;
}

export function PortalHeader({
  activeView,
  onViewChange,
  isAdmin,
  isAdminViewing,
  userEmail,
  onSignOut,
  onActivityFeedOpen,
}: PortalHeaderProps) {
  return (
    <header className="glass-header entrance-header">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <img src={dazeLogo} alt="Daze" className="h-8 sm:h-10 w-auto" />
          {isAdminViewing && (
            <Badge variant="secondary" className="bg-warning/10 text-warning border-0 font-bold uppercase tracking-wide text-2xs">
              Admin
            </Badge>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          {/* View Tabs */}
          <Tabs value={activeView} onValueChange={(v) => onViewChange(v as PortalView)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="onboarding" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Onboarding
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="w-4 h-4" />
                Documents
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isAdmin && <AdminHotelSwitcher />}
          
          {/* Activity Feed Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onActivityFeedOpen}
                  className="h-9 w-9 rounded-full"
                >
                  <Clock className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Activity Feed</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {userEmail}
          </span>
          <Button variant="ghost" size="sm" onClick={onSignOut} className="min-h-[44px]">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
