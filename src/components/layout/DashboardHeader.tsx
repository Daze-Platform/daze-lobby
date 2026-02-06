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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <img src={dazeLogo} alt="Daze" className="h-6 w-6 object-contain" />
            <span className="text-xs font-semibold tracking-tight">Daze Lobby</span>
          </div>
          <Badge variant="outline" className="text-2xs font-medium">
            Control Tower
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isTest && (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-amber-950 border-0 text-2xs font-bold">
              TEST DATA
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.fullName || user?.email}</span>
                <Badge variant={getRoleBadgeVariant(role)} className="text-2xs">
                  {formatRole(role)}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.fullName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
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