import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, AlertTriangle, Cpu, LucideIcon } from "lucide-react";
import { KanbanBoard } from "@/components/kanban";
import { useClients } from "@/hooks/useClients";

interface StatCard {
  label: string;
  value: string;
  icon: LucideIcon;
  route: string;
}

export default function Dashboard() {
  const { role } = useAuthContext();
  const { data: clients, isLoading } = useClients();
  const navigate = useNavigate();

  // Compute stats from client data - focused on onboarding velocity (no ARR)
  const stats = useMemo<StatCard[]>(() => {
    if (!clients) {
      return [
        { label: "Total Clients", value: "0", icon: Building2, route: "/clients" },
        { label: "Incomplete", value: "0", icon: AlertTriangle, route: "/blockers" },
        { label: "Devices", value: "0", icon: Cpu, route: "/devices" },
      ];
    }

    const totalClients = clients.length;
    // Incomplete = pending tasks + blockers combined
    const incompleteCount = clients.reduce((sum, c) => sum + c.incompleteCount, 0);
    const totalDazeDevices = clients.reduce((sum, c) => sum + c.dazeDeviceCount, 0);

    return [
      { label: "Total Clients", value: totalClients.toString(), icon: Building2, route: "/clients" },
      { label: "Incomplete", value: incompleteCount.toString(), icon: AlertTriangle, route: "/blockers" },
      { label: "Devices", value: totalDazeDevices.toString(), icon: Cpu, route: "/devices" },
    ];
  }, [clients]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Overview - 3 cards focused on onboarding velocity */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={stat.label} 
              className="hover:-translate-y-1 hover:shadow-soft-lg cursor-pointer animate-fade-in-up transition-all duration-300"
              style={{ animationDelay: `${index * 80}ms` }}
              onClick={() => navigate(stat.route)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 pt-3 sm:pt-4 px-4 sm:px-6">
                <span className="label-micro text-[9px] sm:text-[10px]">{stat.label}</span>
                <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-3 sm:pb-4">
                {isLoading ? (
                  <Skeleton className="h-7 sm:h-9 w-16 sm:w-20" />
                ) : (
                  <div className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums">
                    {stat.value}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban Lifecycle Board - Entrance delayed (opacity-only to avoid DnD offset issues) */}
        <div className="space-y-3 sm:space-y-4 animate-fade-in" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg sm:text-xl font-semibold">Client Lifecycle</h2>
            <Badge variant="secondary" className="text-2xs font-medium hidden sm:inline-flex">
              Drag to change phase
            </Badge>
          </div>
          <KanbanBoard />
        </div>
      </div>
    </DashboardLayout>
  );
}
