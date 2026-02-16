import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Buildings, Warning, DeviceMobile, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { KanbanBoard } from "@/components/kanban";
import { useClients } from "@/hooks/useClients";
import { useDevices } from "@/hooks/useDevices";

interface StatCard {
  label: string;
  value: string;
  icon: PhosphorIcon;
  route: string;
  borderColor: string;
}

export default function Dashboard() {
  const { role } = useAuthContext();
  const { data: clients, isLoading } = useClients();
  const { data: allDevices, isLoading: devicesLoading } = useDevices();
  const navigate = useNavigate();

  // Compute stats from client data - focused on onboarding velocity (no ARR)
  const stats = useMemo<StatCard[]>(() => {
    if (!clients) {
      return [
        { label: "Total Clients", value: "0", icon: Buildings, route: "/clients", borderColor: "border-t-primary" },
        { label: "Incomplete", value: "0", icon: Warning, route: "/blockers", borderColor: "border-t-orange-500" },
        { label: "Devices", value: "0", icon: DeviceMobile, route: "/devices", borderColor: "border-t-emerald-500" },
      ];
    }

    // Exclude test clients from stats
    const realClients = clients.filter(c => !c.is_test);
    const totalClients = realClients.length;
    // Incomplete = pending tasks + blockers combined (real clients only)
    const incompleteCount = realClients.reduce((sum, c) => sum + c.incompleteCount, 0);
    // Exclude devices belonging to test clients
    const testClientIds = new Set(clients.filter(c => c.is_test).map(c => c.id));
    const totalDevices = allDevices?.filter(d => !testClientIds.has(d.client_id)).length ?? 0;

    return [
      { label: "Total Clients", value: totalClients.toString(), icon: Buildings, route: "/clients", borderColor: "border-t-primary" },
      { label: "Incomplete", value: incompleteCount.toString(), icon: Warning, route: "/blockers", borderColor: "border-t-orange-500" },
      { label: "Devices", value: totalDevices.toString(), icon: DeviceMobile, route: "/devices", borderColor: "border-t-emerald-500" },
    ];
  }, [clients, allDevices]);

  return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Overview - 3 cards focused on onboarding velocity */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={stat.label} 
              className={`hover:-translate-y-1 hover:shadow-soft-lg cursor-pointer animate-fade-in-up transition-all duration-300 border-t-4 ${stat.borderColor}`}
              style={{ animationDelay: `${index * 80}ms` }}
              onClick={() => navigate(stat.route)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 pt-3 sm:pt-4 px-4 sm:px-6">
                <span className="label-micro text-[8px] sm:text-[10px] break-words">{stat.label}</span>
                <stat.icon size={16} weight="duotone" className="text-muted-foreground" />
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

        {/* Kanban Lifecycle Board */}
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
  );
}
