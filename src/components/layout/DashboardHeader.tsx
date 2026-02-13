import { useState } from "react";
import { LogOut, Settings, Menu } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import dazeLogo from "@/assets/daze-logo.png";
import { isTestEnvironment } from "@/lib/environment";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export function DashboardHeader({ onMenuToggle, showMenuButton }: DashboardHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, role } = useAuthContext();
  const navigate = useNavigate();
  const isTest = isTestEnvironment();
  // Fallback to hook if showMenuButton not provided
  const shouldShowMenu = showMenuButton ?? useIsMobileOrTablet();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "admin":
        return "default";
      case "ops_manager":
        return "secondary";
      case "support":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatRole = (role: string | null) => {
    if (!role) return "No Role";
    return role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <header className="glass-header">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Menu button for mobile and tablet */}
          {shouldShowMenu && onMenuToggle && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuToggle}
              className="h-10 w-10 shrink-0"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          )}
          
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={dazeLogo} alt="Daze" className="h-7 w-7 sm:h-8 sm:w-8 object-contain dark:brightness-110 dark:contrast-110" />
            <div className="flex flex-col">
              <span className="font-display text-base sm:text-lg font-semibold tracking-tight">Daze Lobby</span>
              <span className="hidden sm:block text-2xs text-muted-foreground font-medium uppercase tracking-wide">Control Tower</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/50 min-h-[44px] px-2 sm:px-3">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-border/50">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName || user.email} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {user?.fullName
                      ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                      : user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium truncate max-w-[120px] lg:max-w-[200px]">{user?.fullName || user?.email}</span>
                  <span className="text-2xs text-muted-foreground">{formatRole(role)}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-soft-xl border-0">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.fullName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer min-h-[44px]">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer min-h-[44px]">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
