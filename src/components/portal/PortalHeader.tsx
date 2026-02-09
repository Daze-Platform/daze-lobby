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
  // Notification badge for real portal
  unreadNotificationCount?: number;
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
  unreadNotificationCount = 0,
}: PortalHeaderProps) {
  // Show badge count: for preview use activityCount, for real portal use unreadNotificationCount
  const badgeCount = isPreview ? (activityCount > 1 ? activityCount : 0) : unreadNotificationCount;
  
  return (
    <header className="glass-header entrance-header">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="h-16 sm:h-[72px] flex items-center justify-between gap-4">
          {/* Left: Logo + Mode Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <img src={dazeLogo} alt="Daze" className="h-8 sm:h-9 w-auto" />
            {isPreview && (
              <Badge variant="secondary" className="bg-warning/10 text-warning border-0 font-bold uppercase tracking-wide text-2xs px-2 py-0.5">
                Preview
              </Badge>
            )}
            {isAdminViewing && !isPreview && (
              <Badge variant="secondary" className="bg-warning/10 text-warning border-0 font-bold uppercase tracking-wide text-2xs px-2 py-0.5">
                Admin
              </Badge>
            )}
          </div>

          {/* Center: Navigation Tabs */}
          <div className="hidden md:flex items-center justify-center flex-1 min-w-0">
            <Tabs value={activeView} onValueChange={(v) => onViewChange(v as PortalView)}>
              <TabsList className="bg-muted/50 h-10">
                <TabsTrigger value="onboarding" className="gap-2 px-4 h-8">
                  <ClipboardList className="w-4 h-4" strokeWidth={1.5} />
                  <span className="font-medium">Onboarding</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2 px-4 h-8">
                  <FileText className="w-4 h-4" strokeWidth={1.5} />
                  <span className="font-medium">Documents</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Admin Hotel Switcher */}
            {isAdmin && !isPreview && <AdminHotelSwitcher />}
            
            {/* Divider when admin switcher is shown */}
            {isAdmin && !isPreview && (
              <div className="h-6 w-px bg-border/50" />
            )}
            
            {/* Reset Tour Button - Preview only */}
            {isPreview && onResetTour && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground h-9 px-3"
                onClick={onResetTour}
              >
                <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden lg:inline">Reset Tour</span>
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
                    className="h-9 w-9 rounded-full relative shrink-0"
                  >
                    <Clock className="w-4 h-4" strokeWidth={1.5} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center animate-pulse">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Activity Feed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* User Email */}
            {!isPreview && userEmail && (
              <span className="text-sm text-muted-foreground truncate max-w-[180px] hidden lg:block">
                {userEmail}
              </span>
            )}
            
            {/* Sign Out / Back Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSignOut} 
              className="gap-2 h-9 px-3 text-muted-foreground hover:text-foreground"
            >
              {isPreview ? (
                <>
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Back</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Sign Out</span>
                </>
              )}
            </Button>
          </div>

          {/* Mobile Menu Button - could be expanded later */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onActivityFeedOpen}
              className="h-9 w-9 rounded-full relative"
            >
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onSignOut} className="h-9 w-9">
              {isPreview ? (
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
