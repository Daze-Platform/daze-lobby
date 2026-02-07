import { useMemo } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, AlertTriangle, Cpu, TrendingUp, LucideIcon } from "lucide-react";
import { KanbanBoard } from "@/components/kanban";
import { useHotels } from "@/hooks/useHotels";

// Format currency with K/M suffixes
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${amount.toLocaleString()}`;
};

interface StatCard {
  label: string;
  value: string;
  icon: LucideIcon;
}

export default function Dashboard() {
  const { role } = useAuthContext();
  const { data: hotels, isLoading } = useHotels();

  // Compute stats from hotel data
  const stats = useMemo<StatCard[]>(() => {
    if (!hotels) {
      return [
        { label: "Total Clients", value: "0", icon: Building2 },
        { label: "Active Blockers", value: "0", icon: AlertTriangle },
        { label: "Devices", value: "0", icon: Cpu },
        { label: "Total ARR", value: "$0", icon: TrendingUp },
      ];
    }

    const totalClients = hotels.length;
    const activeBlockers = hotels.filter(h => h.hasBlocker).length;
    const totalDazeDevices = hotels.reduce((sum, h) => sum + h.dazeDeviceCount, 0);
    const totalARR = hotels.reduce((sum, h) => sum + (h.arr || 0), 0);

    return [
      { label: "Total Clients", value: totalClients.toString(), icon: Building2 },
      { label: "Active Blockers", value: activeBlockers.toString(), icon: AlertTriangle },
      { label: "Devices", value: totalDazeDevices.toString(), icon: Cpu },
      { label: "Total ARR", value: formatCurrency(totalARR), icon: TrendingUp },
    ];
  }, [hotels]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Overview - Staggered entrance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={stat.label} 
              className="hover:-translate-y-1 hover:shadow-soft-lg cursor-pointer animate-fade-in-up transition-all duration-300"
              style={{ animationDelay: `${index * 80}ms` }}
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

        {/* Kanban Lifecycle Board - Entrance delayed */}
        <div className="space-y-3 sm:space-y-4 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
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
