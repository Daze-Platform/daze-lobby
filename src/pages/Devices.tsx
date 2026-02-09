import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DeviceTablet, 
  WifiHigh, 
  WifiSlash, 
  Monitor, 
  DeviceMobile, 
  Printer, 
  Buildings, 
  Calendar, 
  MagnifyingGlass,
  Warning,
  BatteryLow,
  MapPin,
  type Icon as PhosphorIcon
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DeviceDetailPanel, type Device } from "@/components/dashboard/DeviceDetailPanel";

const mockDevices: Device[] = [
  { 
    id: "1", 
    serial: "DZ-2024-001", 
    type: "Tablet", 
    hotel: "Royal Plaza Hotel", 
    venue: "Pool Deck",
    status: "online", 
    installDate: "2024-10-15",
    batteryLevel: 92,
    signalStrength: 98,
    lastHeartbeat: "1 min ago",
    model: "iPad Pro 12.9\" (6th Gen)",
    ipAddress: "192.168.1.101",
  },
  { 
    id: "2", 
    serial: "DZ-2024-002", 
    type: "Tablet", 
    hotel: "Royal Plaza Hotel", 
    venue: "Lobby Bar",
    status: "online", 
    installDate: "2024-10-15",
    batteryLevel: 78,
    signalStrength: 85,
    lastHeartbeat: "3 min ago",
  },
  { 
    id: "3", 
    serial: "DZ-2024-003", 
    type: "Kiosk", 
    hotel: "Royal Plaza Hotel", 
    venue: "Main Entrance",
    status: "online", 
    installDate: "2024-10-20",
    batteryLevel: 100,
    signalStrength: 95,
    lastHeartbeat: "30 sec ago",
  },
  { 
    id: "4", 
    serial: "DZ-2024-004", 
    type: "Tablet", 
    hotel: "Grand Metropolitan", 
    venue: "Rooftop Lounge",
    status: "online", 
    installDate: "2024-09-01",
    batteryLevel: 45,
    signalStrength: 72,
    lastHeartbeat: "5 min ago",
  },
  { 
    id: "5", 
    serial: "DZ-2024-005", 
    type: "Tablet", 
    hotel: "Grand Metropolitan", 
    venue: "Restaurant",
    status: "offline", 
    installDate: "2024-09-01",
    batteryLevel: 12,
    signalStrength: 0,
    lastHeartbeat: "3 hours ago",
  },
  { 
    id: "6", 
    serial: "DZ-2024-006", 
    type: "Handheld", 
    hotel: "Grand Metropolitan", 
    venue: "Room Service",
    status: "maintenance", 
    installDate: "2024-09-05",
    batteryLevel: 67,
    signalStrength: 88,
    lastHeartbeat: "10 min ago",
  },
  { 
    id: "7", 
    serial: "DZ-2024-007", 
    type: "Kiosk", 
    hotel: "Grand Metropolitan", 
    venue: "Spa Reception",
    status: "online", 
    installDate: "2024-09-10",
    batteryLevel: 100,
    signalStrength: 99,
    lastHeartbeat: "45 sec ago",
  },
  { 
    id: "8", 
    serial: "DZ-2024-008", 
    type: "Printer", 
    hotel: "The Landmark Hotel", 
    venue: "Kitchen",
    status: "online", 
    installDate: "2024-11-01",
    batteryLevel: 100,
    signalStrength: 91,
    lastHeartbeat: "2 min ago",
  },
];

const deviceIcons: Record<string, PhosphorIcon> = {
  Tablet: DeviceTablet,
  Kiosk: Monitor,
  Handheld: DeviceMobile,
  Printer: Printer,
};

const statusConfig = {
  online: { 
    color: "text-emerald-500", 
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    pulseColor: "bg-emerald-500",
    label: "Active",
    icon: WifiHigh,
  },
  offline: { 
    color: "text-rose-500", 
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    pulseColor: "bg-rose-500",
    label: "Offline",
    icon: WifiSlash,
  },
  maintenance: { 
    color: "text-amber-500", 
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    pulseColor: "bg-amber-500",
    label: "Update Pending",
    icon: Warning,
  },
};

type FilterType = "all" | "offline" | "low-battery";

function DeviceCard({ 
  device, 
  onClick 
}: { 
  device: Device; 
  onClick: () => void;
}) {
  const DeviceIcon = deviceIcons[device.type] || DeviceTablet;
  const config = statusConfig[device.status];
  const StatusIcon = config.icon;
  const batteryLevel = device.batteryLevel ?? 100;
  const isLowBattery = batteryLevel < 30;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-2xl cursor-pointer transition-all duration-300",
        "bg-card/60 backdrop-blur-sm",
        "border border-border/40",
        "hover:border-primary/30 hover:shadow-soft-lg hover:-translate-y-1",
        "active:scale-[0.98] active:translate-y-0"
      )}
    >
      {/* Liquid Glass Overlay Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Status Pulse Indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div className="relative">
          <span className={cn(
            "block w-2.5 h-2.5 rounded-full",
            config.pulseColor
          )} />
          {device.status !== "offline" && (
            <span className={cn(
              "absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-75",
              config.pulseColor
            )} />
          )}
        </div>
        <span className={cn("text-2xs font-medium", config.color)}>
          {config.label}
        </span>
      </div>

      <div className="flex items-start gap-3">
        {/* Device Icon */}
        <div className={cn(
          "relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          "bg-gradient-to-br from-primary/15 to-primary/5",
          "ring-1 ring-primary/10 group-hover:ring-primary/20 transition-all"
        )}>
          <DeviceIcon size={24} weight="duotone" className="text-primary" />
          {/* Battery Warning Badge */}
          {isLowBattery && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center ring-2 ring-background">
              <BatteryLow size={10} weight="bold" className="text-amber-500" />
            </div>
          )}
        </div>

        {/* Device Info */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-semibold text-sm text-foreground truncate">{device.serial}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{device.type}</p>
        </div>
      </div>

      {/* Details Row */}
      <div className="mt-4 pt-3 border-t border-border/30 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin size={12} weight="duotone" className="shrink-0" />
          <span className="truncate">{device.venue || "Unassigned"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Buildings size={12} weight="duotone" className="shrink-0" />
          <span className="truncate">{device.hotel}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={12} weight="duotone" className="shrink-0" />
          <span>Installed {format(new Date(device.installDate), "MMM d, yyyy")}</span>
        </div>
      </div>

      {/* Battery & Signal Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Battery Indicator */}
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-5 h-2.5 rounded-sm border relative overflow-hidden",
              isLowBattery ? "border-amber-500/50" : "border-muted-foreground/30"
            )}>
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 rounded-sm transition-all",
                  isLowBattery ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
            <span className={cn(
              "text-2xs",
              isLowBattery ? "text-amber-500" : "text-muted-foreground"
            )}>
              {batteryLevel}%
            </span>
          </div>
          
          {/* Signal Indicator */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((bar) => (
              <div 
                key={bar}
                className={cn(
                  "w-0.5 rounded-full transition-all",
                  bar === 1 ? "h-1" : bar === 2 ? "h-1.5" : bar === 3 ? "h-2" : "h-2.5",
                  (device.signalStrength ?? 0) >= bar * 25 
                    ? "bg-primary" 
                    : "bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </div>

        {/* Last Heartbeat */}
        <span className="text-2xs text-muted-foreground/70">
          {device.lastHeartbeat || "—"}
        </span>
      </div>
    </div>
  );
}

export default function Devices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const filteredDevices = useMemo(() => {
    let devices = mockDevices;

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      devices = devices.filter(d => 
        d.serial.toLowerCase().includes(query) ||
        d.hotel.toLowerCase().includes(query) ||
        d.venue?.toLowerCase().includes(query) ||
        d.type.toLowerCase().includes(query)
      );
    }

    // Apply quick filters
    if (activeFilter === "offline") {
      devices = devices.filter(d => d.status === "offline");
    } else if (activeFilter === "low-battery") {
      devices = devices.filter(d => (d.batteryLevel ?? 100) < 30);
    }

    return devices;
  }, [searchQuery, activeFilter]);

  const onlineCount = mockDevices.filter(d => d.status === "online").length;
  const offlineCount = mockDevices.filter(d => d.status === "offline").length;
  const lowBatteryCount = mockDevices.filter(d => (d.batteryLevel ?? 100) < 30).length;

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setIsPanelOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Daze Devices</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Hardware inventory and status</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1.5">
              <DeviceTablet size={14} weight="duotone" />
              {mockDevices.length} Total
            </Badge>
            <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20">
              <WifiHigh size={14} weight="duotone" />
              {onlineCount} Online
            </Badge>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className={cn(
          "flex flex-col sm:flex-row gap-3 p-3 rounded-2xl",
          "bg-card/60 backdrop-blur-sm border border-border/40"
        )}>
          {/* Search Input */}
          <div className="relative flex-1">
            <MagnifyingGlass size={16} weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by device name, venue, or hotel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-background/50 border-border/50 focus:bg-background"
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className="h-10 px-4"
            >
              All
            </Button>
            <Button
              variant={activeFilter === "offline" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("offline")}
              className={cn(
                "h-10 px-4 gap-1.5",
                activeFilter === "offline" && "bg-rose-500 hover:bg-rose-600"
              )}
            >
              <WifiSlash size={14} weight="duotone" />
              Offline
              {offlineCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 h-5 px-1.5 text-2xs",
                    activeFilter === "offline" ? "bg-rose-400/30 text-white" : "bg-rose-500/10 text-rose-500"
                  )}
                >
                  {offlineCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeFilter === "low-battery" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("low-battery")}
              className={cn(
                "h-10 px-4 gap-1.5",
                activeFilter === "low-battery" && "bg-amber-500 hover:bg-amber-600 text-white"
              )}
            >
              <BatteryLow className="h-3.5 w-3.5" strokeWidth={1.5} />
              Low Battery
              {lowBatteryCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 h-5 px-1.5 text-2xs",
                    activeFilter === "low-battery" ? "bg-amber-400/30 text-white" : "bg-amber-500/10 text-amber-500"
                  )}
                >
                  {lowBatteryCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Device Grid */}
        {filteredDevices.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDevices.map((device) => (
              <DeviceCard 
                key={device.id} 
                device={device} 
                onClick={() => handleDeviceClick(device)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-[10px] bg-muted/50 flex items-center justify-center mb-4">
              <DeviceTablet size={32} weight="duotone" className="text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No devices found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Device Detail Panel */}
      <DeviceDetailPanel
        device={selectedDevice}
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
      />
    </DashboardLayout>
  );
}
