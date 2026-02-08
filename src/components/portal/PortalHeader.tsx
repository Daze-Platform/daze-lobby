import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Clock, ClipboardList, FileText, ArrowLeft, RotateCcw } from "lucide-react";
import { AdminHotelSwitcher } from "./AdminHotelSwitcher";
import dazeLogo from "@/assets/daze-logo.png";

export type PortalView = "onboarding" | "documents";

interface PortalHeaderProps {
  activeView: PortalView;
  onViewChange: (view: PortalView) => void;
  isAdmin?: boolean;
  isAdminViewing?: boolean;
  userEmail?: string;
  onSignOut: () => void;
  onActivityFeedOpen: () => void;
  // Preview mode props
  isPreview?: boolean;
  activityCount?: number;
  onResetTour?: () => void;
}

export function PortalHeader({
  activeView,
  onViewChange,
  isAdmin = false,
  isAdminViewing = false,
  userEmail,
  onSignOut,
  onActivityFeedOpen,
  isPreview = false,
  activityCount = 0,
  onResetTour,
}: PortalHeaderProps) {
  return (
    <header className="glass-header entrance-header">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <img src={dazeLogo} alt="Daze" className="h-8 sm:h-10 w-auto" />
          {isPreview && (
            <Badge variant="secondary" className="bg-warning/10 text-warning border-0 font-bold uppercase tracking-wide text-2xs">
              Preview
            </Badge>
          )}
          {isAdminViewing && !isPreview && (
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

          {isAdmin && !isPreview && <AdminHotelSwitcher />}
          
          {/* Reset Tour Button - Preview only */}
          {isPreview && onResetTour && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground min-h-[44px]"
              onClick={onResetTour}
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
              Reset Tour
            </Button>
          )}
          
          {/* Activity Feed Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onActivityFeedOpen}
                  className="h-9 w-9 rounded-full relative"
                >
                  <Clock className="w-4 h-4" strokeWidth={1.5} />
                  {isPreview && activityCount > 1 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                      {activityCount > 9 ? "9+" : activityCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Activity Feed</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {!isPreview && userEmail && (
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {userEmail}
            </span>
          )}
          
          <Button variant="ghost" size="sm" onClick={onSignOut} className="gap-2 min-h-[44px]">
            {isPreview ? (
              <>
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                Back to Login
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Sign Out
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
