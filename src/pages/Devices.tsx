import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  Package,
  Trash,
  CircleNotch,
  type Icon as PhosphorIcon
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DeviceDetailPanel } from "@/components/dashboard/DeviceDetailPanel";
import { useDevices, useDeleteDevice, useClientList, type DeviceWithClient } from "@/hooks/useDevices";
import { Skeleton } from "@/components/ui/skeleton";

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
  onClick,
  onDelete,
}: { 
  device: DeviceWithClient; 
  onClick: () => void;
  onDelete: () => void;
}) {
  const DeviceIcon = deviceIcons[device.device_type] || DeviceTablet;
  const config = statusConfig[device.status];
  const StatusIcon = config.icon;
  const batteryLevel = device.batteryLevel ?? 100;
  const isLowBattery = batteryLevel < 30;
  const isUnassigned = !device.clientName;

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
      
      {/* Status Pulse Indicator + Delete */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash size={14} weight="duotone" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Delete device</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
          <p className="font-semibold text-sm text-foreground truncate">{device.serial_number}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{device.device_type}</p>
        </div>
      </div>

      {/* Details Row */}
      <div className="mt-4 pt-3 border-t border-border/30 space-y-1.5">
        {device.venue && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin size={12} weight="duotone" className="shrink-0" />
            <span className="truncate">{device.venue}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <Buildings size={12} weight="duotone" className="shrink-0 text-muted-foreground" />
          {isUnassigned ? (
            <Badge variant="secondary" className="text-2xs px-1.5 py-0 h-4 bg-muted text-muted-foreground">
              <Package size={10} className="mr-1" />
              In Stock / Unassigned
            </Badge>
          ) : (
            <span className="truncate text-muted-foreground">{device.clientName}</span>
          )}
        </div>
        {device.install_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={12} weight="duotone" className="shrink-0" />
            <span>Installed {format(new Date(device.install_date), "MMM d, yyyy")}</span>
          </div>
        )}
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
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithClient | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [deleteDeviceTarget, setDeleteDeviceTarget] = useState<DeviceWithClient | null>(null);

  const { data: devices = [], isLoading } = useDevices();
  const { data: clients = [] } = useClientList();
  const deleteDeviceMutation = useDeleteDevice();

  const filteredDevices = useMemo(() => {
    let result = devices;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.serial_number.toLowerCase().includes(query) ||
        (d.clientName?.toLowerCase().includes(query)) ||
        d.venue?.toLowerCase().includes(query) ||
        d.device_type.toLowerCase().includes(query)
      );
    }

    // Client filter
    if (clientFilter !== "all") {
      result = result.filter(d => d.client_id === clientFilter);
    }

    // Quick filters
    if (activeFilter === "offline") {
      result = result.filter(d => d.status === "offline");
    } else if (activeFilter === "low-battery") {
      result = result.filter(d => (d.batteryLevel ?? 100) < 30);
    }

    return result;
  }, [searchQuery, activeFilter, clientFilter, devices]);

  const onlineCount = devices.filter(d => d.status === "online").length;
  const offlineCount = devices.filter(d => d.status === "offline").length;
  const lowBatteryCount = devices.filter(d => (d.batteryLevel ?? 100) < 30).length;

  const handleDeviceClick = (device: DeviceWithClient) => {
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
              {devices.length} Total
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
              placeholder="Search by serial, client, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-background/50 border-border/50 focus:bg-background"
            />
          </div>

          {/* Client Filter */}
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <Buildings size={14} weight="duotone" className="mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

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
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px] rounded-2xl" />
            ))}
          </div>
        ) : filteredDevices.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDevices.map((device) => (
              <DeviceCard 
                key={device.id} 
                device={device} 
                onClick={() => handleDeviceClick(device)}
                onDelete={() => setDeleteDeviceTarget(device)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDeviceTarget} onOpenChange={(open) => !open && setDeleteDeviceTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDeviceTarget?.serial_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this device from the inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDeviceTarget) {
                  deleteDeviceMutation.mutate(deleteDeviceTarget.id, {
                    onSettled: () => setDeleteDeviceTarget(null),
                  });
                  // Log activity
                  supabase.from("activity_logs").insert([{
                    client_id: deleteDeviceTarget.client_id,
                    action: "device_deleted",
                    details: { serial_number: deleteDeviceTarget.serial_number, device_type: deleteDeviceTarget.device_type } as unknown as Json,
                    is_auto_logged: false,
                  }]);
                }
              }}
              disabled={deleteDeviceMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleteDeviceMutation.isPending && <CircleNotch size={16} weight="bold" className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
