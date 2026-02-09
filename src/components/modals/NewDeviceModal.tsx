import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Check, Cpu } from "lucide-react";
import { DeviceTablet, Desktop, DeviceMobile, Printer } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const DEVICE_TYPES = [
  { value: "Tablet", label: "Tablet", icon: DeviceTablet },
  { value: "Kiosk", label: "Kiosk", icon: Desktop },
  { value: "Handheld", label: "Handheld", icon: DeviceMobile },
  { value: "Printer", label: "Printer", icon: Printer },
] as const;

interface NewDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function NewDeviceModal({ open, onOpenChange, clientId, clientName }: NewDeviceModalProps) {
  const queryClient = useQueryClient();

  const [deviceType, setDeviceType] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isDazeOwned, setIsDazeOwned] = useState(true);
  const [status, setStatus] = useState<"online" | "offline">("offline");

  const resetForm = () => {
    setDeviceType("");
    setQuantity(1);
    setIsDazeOwned(true);
    setStatus("offline");
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const createDevicesMutation = useMutation({
    mutationFn: async () => {
      // Get highest existing DZ- serial number
      const year = new Date().getFullYear();
      const prefix = `DZ-${year}-`;

      const { data: existing } = await supabase
        .from("devices")
        .select("serial_number")
        .like("serial_number", `${prefix}%`)
        .order("serial_number", { ascending: false })
        .limit(1);

      let startNum = 1;
      if (existing && existing.length > 0) {
        const lastSerial = existing[0].serial_number;
        const lastNum = parseInt(lastSerial.split("-").pop() || "0", 10);
        startNum = lastNum + 1;
      }

      const devices = Array.from({ length: quantity }, (_, i) => ({
        client_id: clientId,
        device_type: deviceType,
        serial_number: `${prefix}${String(startNum + i).padStart(3, "0")}`,
        is_daze_owned: isDazeOwned,
        status: status,
      }));

      const { error } = await supabase.from("devices").insert(devices);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices-count"] });
      queryClient.invalidateQueries({ queryKey: ["client-devices", clientId] });
      toast.success(
        `${quantity} device${quantity > 1 ? "s" : ""} added to ${clientName}`
      );
      handleClose();
    },
    onError: (error) => {
      console.error("Failed to create devices:", error);
      toast.error("Failed to create devices. Please try again.");
    },
  });

  const isSubmitting = createDevicesMutation.isPending;
  const canSubmit = deviceType.length > 0 && quantity >= 1 && quantity <= 50;

  const selectedTypeConfig = DEVICE_TYPES.find((t) => t.value === deviceType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                New Device
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add hardware for {clientName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Device Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Device Type <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {DEVICE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = deviceType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setDeviceType(type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-sm",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:border-border"
                    )}
                  >
                    <Icon size={24} weight={isSelected ? "duotone" : "regular"} />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              className="h-11 w-24"
            />
            <p className="text-xs text-muted-foreground">
              Serial numbers will be auto-generated (DZ-{new Date().getFullYear()}-NNN)
            </p>
          </div>

          {/* Ownership */}
          <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
            <div>
              <Label className="text-sm font-medium">Daze-Owned</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isDazeOwned ? "Managed by Daze" : "Property-owned hardware"}
              </p>
            </div>
            <Switch checked={isDazeOwned} onCheckedChange={setIsDazeOwned} />
          </div>

          {/* Initial Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Initial Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "online" | "offline")}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offline">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    Offline
                  </span>
                </SelectItem>
                <SelectItem value="online">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border/40 flex items-center justify-between">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => createDevicesMutation.mutate()}
            disabled={!canSubmit || isSubmitting}
            className="gap-2 min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Add {quantity} Device{quantity > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
