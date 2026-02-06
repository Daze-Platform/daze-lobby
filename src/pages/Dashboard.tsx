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
      <div className="p-6 space-y-6">
        {/* Stats Overview - Staggered entrance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={stat.label} 
              className="hover:-translate-y-1 hover:shadow-soft-lg cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-6">
                <span className="label-micro">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-6 pb-4">
                <div className="font-display text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban Lifecycle Board - Entrance delayed */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Hotel Lifecycle</h2>
            <Badge variant="secondary" className="text-2xs font-medium">
              Drag to change phase
            </Badge>
          </div>
          <KanbanBoard />
        </div>

      </div>
    </DashboardLayout>
  );
}
