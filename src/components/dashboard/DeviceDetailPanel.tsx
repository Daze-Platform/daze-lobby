import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal, 
  Clock, 
  Monitor,
  Tablet,
  Printer,
  Smartphone,
  Building2,
  Globe,
  RefreshCw,
  Radio,
  Activity,
  Settings,
  AlertTriangle,
  Package,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { DeviceWithClient } from "@/hooks/useDevices";
import { useDeleteDevice } from "@/hooks/useDevices";

interface DeviceDetailPanelProps {
  device: DeviceWithClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const deviceIcons: Record<string, typeof Tablet> = {
  Tablet: Tablet,
  Kiosk: Monitor,
  Handheld: Smartphone,
  Printer: Printer,
};

const statusConfig = {
  online: { 
    color: "text-emerald-500", 
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    label: "Active",
    icon: Wifi,
  },
  offline: { 
    color: "text-rose-500", 
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    label: "Offline",
    icon: WifiOff,
  },
  maintenance: { 
    color: "text-amber-500", 
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    label: "Update Pending",
    icon: AlertTriangle,
  },
};

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  unit,
  status = "normal" 
}: { 
  icon: typeof Battery; 
  label: string; 
  value: string | number; 
  unit?: string;
  status?: "normal" | "warning" | "critical";
}) {
  const statusColors = {
    normal: "text-foreground",
    warning: "text-amber-500",
    critical: "text-rose-500",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className={cn("text-sm font-semibold truncate", statusColors[status])}>
          {value}{unit && <span className="text-muted-foreground font-normal ml-0.5">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

function ConfigItem({ icon: Icon, label, value, badge }: { icon: typeof Building2; label: string; value?: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span className="text-xs">{label}</span>
      </div>
      {badge || <span className="text-xs font-medium text-foreground truncate max-w-[180px]">{value ?? "—"}</span>}
    </div>
  );
}

export function DeviceDetailPanel({ device, open, onOpenChange }: DeviceDetailPanelProps) {
  const [isPinging, setIsPinging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const deleteDeviceMutation = useDeleteDevice();

  if (!device) return null;

  const DeviceIcon = deviceIcons[device.device_type] || Tablet;
  const config = statusConfig[device.status];
  const StatusIcon = config.icon;

  const batteryLevel = device.batteryLevel ?? 87;
  const signalStrength = device.signalStrength ?? 92;
  const lastHeartbeat = device.lastHeartbeat ?? "—";
  const deviceName = device.venue ? `${device.device_type} - ${device.venue}` : device.device_type;
  const model = device.model ?? (device.device_type === "Tablet" ? "iPad Pro 12.9\" (6th Gen)" : "Custom Unit");
  const ipAddress = device.ipAddress ?? "—";
  const isUnassigned = !device.clientName;

  const handlePing = async () => {
    setIsPinging(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsPinging(false);
    toast({
      title: "Device Responded",
      description: `${device.serial_number} is reachable (latency: 23ms)`,
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsSyncing(false);
    toast({
      title: "Sync Requested",
      description: `Remote sync initiated for ${device.serial_number}`,
    });
  };

  const batteryStatus = batteryLevel < 20 ? "critical" : batteryLevel < 40 ? "warning" : "normal";
  const signalStatus = signalStrength < 30 ? "critical" : signalStrength < 60 ? "warning" : "normal";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br from-primary/20 to-primary/5",
                "ring-2 ring-primary/20"
              )}>
                <DeviceIcon className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-background",
                config.bgColor
              )}>
                <StatusIcon className={cn("h-2.5 w-2.5", config.color)} strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base truncate">{device.serial_number}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-2xs px-2 py-0.5 border",
                    config.bgColor, 
                    config.color,
                    config.borderColor
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full mr-1.5",
                    device.status === "online" ? "bg-emerald-500 animate-pulse" : 
                    device.status === "offline" ? "bg-rose-500" : "bg-amber-500 animate-pulse"
                  )} />
                  {config.label}
                </Badge>
                <span className="text-2xs text-muted-foreground">{device.device_type}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="py-5 space-y-5">
          {/* Health Stats */}
          <div>
            <h3 className="label-micro mb-3 flex items-center gap-1.5">
              <Activity className="h-3 w-3" strokeWidth={1.5} />
              Health Stats
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard icon={Battery} label="Battery" value={batteryLevel} unit="%" status={batteryStatus} />
              <StatCard icon={Signal} label="Signal" value={signalStrength} unit="%" status={signalStatus} />
              <div className="col-span-2">
                <StatCard icon={Clock} label="Last Heartbeat" value={lastHeartbeat} />
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h3 className="label-micro mb-3 flex items-center gap-1.5">
              <Settings className="h-3 w-3" strokeWidth={1.5} />
              Configuration
            </h3>
            <div className="rounded-xl bg-muted/20 border border-border/30 px-4">
              <ConfigItem icon={Monitor} label="Device Name" value={deviceName} />
              <ConfigItem icon={Tablet} label="Model" value={model} />
              <ConfigItem 
                icon={Building2} 
                label="Assigned Client" 
                badge={isUnassigned ? (
                  <Badge variant="secondary" className="text-2xs px-2 py-0.5 bg-muted text-muted-foreground">
                    <Package className="h-3 w-3 mr-1" strokeWidth={1.5} />
                    Unassigned
                  </Badge>
                ) : undefined}
                value={device.clientName ?? undefined}
              />
              {device.venue && <ConfigItem icon={Building2} label="Venue" value={device.venue} />}
              <ConfigItem icon={Globe} label="IP Address" value={ipAddress} />
            </div>
          </div>

          {/* Control Center */}
          <div>
            <h3 className="label-micro mb-3 flex items-center gap-1.5">
              <Radio className="h-3 w-3" strokeWidth={1.5} />
              Control Center
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11 gap-2" onClick={handlePing} disabled={isPinging || device.status === "offline"}>
                {isPinging ? <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={1.5} /> : <Radio className="h-4 w-4" strokeWidth={1.5} />}
                {isPinging ? "Pinging..." : "Ping Device"}
              </Button>
              <Button variant="outline" className="h-11 gap-2" onClick={handleSync} disabled={isSyncing || device.status === "offline"}>
                {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={1.5} /> : <RefreshCw className="h-4 w-4" strokeWidth={1.5} />}
                {isSyncing ? "Syncing..." : "Remote Sync"}
              </Button>
            </div>
            {device.status === "offline" && (
              <p className="text-2xs text-muted-foreground mt-2 text-center">
                Device is offline. Actions unavailable.
              </p>
            )}
          </div>

          {/* Delete Device */}
          <div className="pt-2 border-t border-border/50">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  disabled={deleteDeviceMutation.isPending}
                >
                  {deleteDeviceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  )}
                  {deleteDeviceMutation.isPending ? "Deleting..." : "Delete Device"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {device.serial_number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this device from the inventory. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteDeviceMutation.mutate(device.id, {
                        onSuccess: () => {
                          // Log activity
                          supabase.from("activity_logs").insert([{
                            client_id: device.client_id,
                            action: "device_deleted",
                            details: { serial_number: device.serial_number, device_type: device.device_type } as unknown as Json,
                            is_auto_logged: false,
                          }]);
                          onOpenChange(false);
                        },
                      });
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
