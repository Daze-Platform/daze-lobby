import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tablet, Wifi, WifiOff, Wrench, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";

const mockDevices = [
  { id: "1", serial: "DZ-2024-001", type: "Tablet", hotel: "Royal Plaza Hotel", status: "online", installDate: "2024-10-15" },
  { id: "2", serial: "DZ-2024-002", type: "Tablet", hotel: "Royal Plaza Hotel", status: "online", installDate: "2024-10-15" },
  { id: "3", serial: "DZ-2024-003", type: "Kiosk", hotel: "Royal Plaza Hotel", status: "online", installDate: "2024-10-20" },
  { id: "4", serial: "DZ-2024-004", type: "Tablet", hotel: "Grand Metropolitan", status: "online", installDate: "2024-09-01" },
  { id: "5", serial: "DZ-2024-005", type: "Tablet", hotel: "Grand Metropolitan", status: "offline", installDate: "2024-09-01" },
  { id: "6", serial: "DZ-2024-006", type: "Tablet", hotel: "Grand Metropolitan", status: "maintenance", installDate: "2024-09-05" },
  { id: "7", serial: "DZ-2024-007", type: "Kiosk", hotel: "Grand Metropolitan", status: "online", installDate: "2024-09-10" },
  { id: "8", serial: "DZ-2024-008", type: "Tablet", hotel: "The Landmark Hotel", status: "online", installDate: "2024-11-01" },
];

const statusConfig: Record<string, { icon: typeof Wifi; color: string; label: string }> = {
  online: { icon: Wifi, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Online" },
  offline: { icon: WifiOff, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Offline" },
  maintenance: { icon: Wrench, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", label: "Maintenance" },
};

export default function Devices() {
  const onlineCount = mockDevices.filter(d => d.status === "online").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Daze Devices</h1>
            <p className="text-sm text-muted-foreground">Hardware inventory and status</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Tablet className="h-3.5 w-3.5" />
              {mockDevices.length} Total
            </Badge>
            <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Wifi className="h-3.5 w-3.5" />
              {onlineCount} Online
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mockDevices.map((device) => {
            const config = statusConfig[device.status];
            const StatusIcon = config.icon;
            
            return (
              <Card key={device.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{device.serial}</CardTitle>
                    <Badge className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Tablet className="h-4 w-4" />
                      {device.type}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {device.hotel}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Installed {format(new Date(device.installDate), "MMM d, yyyy")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
