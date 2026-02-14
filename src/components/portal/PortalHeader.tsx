import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignOut, Clock, ClipboardText, FileText, ArrowLeft, ArrowClockwise, Key, Moon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { AdminClientSwitcher } from "./AdminClientSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import dazeLogo from "@/assets/daze-logo.png";

export type PortalView = "onboarding" | "documents";

interface PortalHeaderProps {
  activeView: PortalView;
  onViewChange: (view: PortalView) => void;
  isAdmin?: boolean;
  isAdminViewing?: boolean;
  userEmail?: string;
  userFullName?: string;
  userAvatarUrl?: string | null;
  onSignOut: () => void;
  onActivityFeedOpen: () => void;
  // Preview mode props
  isPreview?: boolean;
  activityCount?: number;
  onResetTour?: () => void;
  // Notification badge for real portal
  unreadNotificationCount?: number;
  // Back to dashboard for admin viewing
  onBackToDashboard?: () => void;
  // Document count for badge on Documents tab
  documentCount?: number;
}

// Generate initials from name or email
function getInitials(name?: string, email?: string): string {
  if (name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return email?.charAt(0).toUpperCase() || "U";
}

export function PortalHeader({
  activeView,
  onViewChange,
  isAdmin = false,
  isAdminViewing = false,
  userEmail,
  userFullName,
  userAvatarUrl,
  onSignOut,
  onActivityFeedOpen,
  isPreview = false,
  activityCount = 0,
  onResetTour,
  unreadNotificationCount = 0,
  onBackToDashboard,
  documentCount = 0,
}: PortalHeaderProps) {
  // Show badge count: for preview use activityCount, for real portal use unreadNotificationCount
  const badgeCount = isPreview ? (activityCount > 1 ? activityCount : 0) : unreadNotificationCount;

  const { theme, setTheme } = useTheme();

  // Change password state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsUpdating(false);
    }
  };
  
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
            {/* Mobile active view indicator */}
            <span className="md:hidden text-xs font-medium text-muted-foreground capitalize">
              {activeView === "onboarding" ? "Onboarding" : "Documents"}
            </span>
            {isAdminViewing && !isPreview && (
              <>
                <Badge variant="secondary" className="bg-warning/10 text-warning border-0 font-bold uppercase tracking-wide text-2xs px-2 py-0.5">
                  Admin
                </Badge>
                {onBackToDashboard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground h-8 px-2.5"
                    onClick={onBackToDashboard}
                  >
                    <ArrowLeft size={14} weight="regular" />
                    <span className="hidden lg:inline text-xs">Dashboard</span>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Center: Navigation Tabs */}
          <div className="hidden md:flex items-center justify-center flex-1 min-w-0">
            <Tabs value={activeView} onValueChange={(v) => onViewChange(v as PortalView)}>
              <TabsList className="bg-muted/50 h-10">
                <TabsTrigger value="onboarding" className="gap-2 px-4 h-8">
                  <ClipboardText size={16} weight="duotone" />
                  <span className="font-medium">Onboarding</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2 px-4 h-8 relative">
                  <FileText size={16} weight="duotone" />
                  <span className="font-medium">Documents</span>
                  {documentCount > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center justify-center">
                      {documentCount > 99 ? "99+" : documentCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Admin Hotel Switcher */}
            {isAdmin && !isPreview && <AdminClientSwitcher />}
            
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
                <ArrowClockwise size={16} weight="regular" />
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
                    <Clock size={16} weight="duotone" />
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
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all">
                  <Avatar className="h-8 w-8 border border-border/50">
                    {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userFullName || userEmail || "User"} />}
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                      {getInitials(userFullName, userEmail)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    {userFullName && (
                      <p className="text-sm font-medium leading-none">{userFullName}</p>
                    )}
                    {userEmail && (
                      <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isPreview && (
                  <DropdownMenuItem onClick={() => setShowPasswordDialog(true)} className="cursor-pointer">
                    <Key size={16} weight="duotone" className="mr-2" />
                    <span>Change Password</span>
                  </DropdownMenuItem>
                )}
                {!isPreview && (
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon size={16} weight="duotone" />
                      <span>Dark Mode</span>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
                  {isPreview ? (
                    <>
                      <ArrowLeft size={16} weight="regular" className="mr-2" />
                      <span>Back to Login</span>
                    </>
                  ) : (
                    <>
                      <SignOut size={16} weight="duotone" className="mr-2" />
                      <span>Sign Out</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button - could be expanded later */}
          <div className="flex md:hidden items-center gap-2">
            {/* Admin back to dashboard on mobile */}
            {isAdminViewing && !isPreview && onBackToDashboard && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground h-8 px-2"
                onClick={onBackToDashboard}
              >
                <ArrowLeft size={14} weight="regular" />
                <span className="text-xs">Back</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onActivityFeedOpen}
              className="h-9 w-9 rounded-full relative"
            >
              <Clock size={16} weight="duotone" />
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </Button>
            
            {/* Mobile Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0">
                  <Avatar className="h-8 w-8 border border-border/50">
                    {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userFullName || userEmail || "User"} />}
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                      {getInitials(userFullName, userEmail)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    {userFullName && (
                      <p className="text-sm font-medium leading-none">{userFullName}</p>
                    )}
                    {userEmail && (
                      <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isPreview && (
                  <DropdownMenuItem onClick={() => setShowPasswordDialog(true)} className="cursor-pointer">
                    <Key size={16} weight="duotone" className="mr-2" />
                    <span>Change Password</span>
                  </DropdownMenuItem>
                )}
                {!isPreview && (
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon size={16} weight="duotone" />
                      <span>Dark Mode</span>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
                  {isPreview ? (
                    <>
                      <ArrowLeft size={16} weight="regular" className="mr-2" />
                      <span>Back to Login</span>
                    </>
                  ) : (
                    <>
                      <SignOut size={16} weight="duotone" className="mr-2" />
                      <span>Sign Out</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => {
        setShowPasswordDialog(open);
        if (!open) { setNewPassword(""); setConfirmPassword(""); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter a new password for your account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handlePasswordUpdate} disabled={isUpdating || !newPassword}>
              {isUpdating ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
