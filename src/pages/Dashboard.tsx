import { useAuthContext } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, AlertTriangle, Cpu, TrendingUp } from "lucide-react";
import { KanbanBoard } from "@/components/kanban";

export default function Dashboard() {
  const { role } = useAuthContext();

  // Placeholder stats - will be replaced with real data
  const stats = [
    { label: "Total Hotels", value: "0", icon: Building2, change: null },
    { label: "Active Blockers", value: "0", icon: AlertTriangle, change: null },
    { label: "Devices Online", value: "0", icon: Cpu, change: null },
    { label: "Total ARR", value: "$0", icon: TrendingUp, change: null },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban Lifecycle Board */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Hotel Lifecycle</h2>
            <Badge variant="outline" className="text-2xs">
              Drag to change phase
            </Badge>
          </div>
          <KanbanBoard />
        </div>

      </div>
    </DashboardLayout>
  );
}
