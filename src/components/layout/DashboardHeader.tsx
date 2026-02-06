import { useState } from "react";
import { LogOut, Settings, User } from "lucide-react";
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

export function DashboardHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, role } = useAuthContext();
  const navigate = useNavigate();
  const isTest = isTestEnvironment();

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
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={dazeLogo} alt="Daze" className="h-8 w-8 object-contain" />
            <div className="flex flex-col">
              <span className="font-display text-lg font-semibold tracking-tight">Daze Lobby</span>
              <span className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">Control Tower</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isTest && (
            <Badge className="bg-warning/10 text-warning border-warning/20 text-2xs font-bold uppercase tracking-wide">
              Test Data
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium">{user?.fullName || user?.email}</span>
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
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
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
