import { useAuthContext } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, AlertTriangle, Cpu, TrendingUp } from "lucide-react";

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

        {/* Main Content Area */}
        <Card className="border-border/50">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Hotel Clients</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-2xs">
                  All Phases
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">
                No hotel clients yet
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                {role === "admin" || role === "ops_manager" 
                  ? "Add your first hotel client to get started"
                  : "Hotel clients will appear here once added"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Info (temporary) */}
        {!role && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium">No role assigned</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Contact an administrator to get access to the dashboard features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
