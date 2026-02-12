import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContactFormModal } from "@/components/modals/ContactFormModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Cpu, 
  Activity,
  FileText,
  Mail,
  Phone,
  Tablet,
  Monitor,
  Settings2,
  Plus,
  Pencil,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DocumentUploadSection } from "./DocumentUploadSection";
import { PortalManagementPanel } from "./portal-management";
import { NewDeviceModal } from "@/components/modals/NewDeviceModal";
import { useActivityLogs, type ActivityLog } from "@/hooks/useActivityLogs";
import { cn } from "@/lib/utils";
import type { Client } from "@/hooks/useClients";
import type { Tables } from "@/integrations/supabase/types";

// Import the shared action config from ActivityFeedPanel
import { getActionConfig, formatAction } from "@/components/portal/ActivityFeedPanel";

interface ClientDetailPanelProps {
  hotel: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ClientContact = Tables<"client_contacts">;

// Helper components
function ContactCard({ contact, onEdit }: { contact: ClientContact; onEdit: () => void }) {
  const initials = contact.name.split(" ").map(n => n[0]).join("").toUpperCase();
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
      <Avatar className="h-10 w-10 ring-2 ring-background">
        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{contact.name}</span>
          {contact.is_primary && (
            <Badge variant="default" className="text-2xs px-1.5 py-0">
              Primary
            </Badge>
          )}
          <button
            onClick={onEdit}
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
            aria-label={`Edit ${contact.name}`}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        {contact.role && (
          <p className="text-xs text-muted-foreground mt-0.5">{contact.role}</p>
        )}
        <div className="flex flex-col gap-1 mt-2">
          {contact.email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DeviceRow {
  id: string;
  device_type: string;
  serial_number: string;
  status: "online" | "offline" | "maintenance";
  last_check_in: string | null;
  is_daze_owned: boolean;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function DeviceCard({ device }: { device: DeviceRow }) {
  const statusConfig = {
    online: { color: "bg-emerald-500", label: "Online" },
    offline: { color: "bg-destructive", label: "Offline" },
    maintenance: { color: "bg-amber-500", label: "Maintenance" },
  };
  
  const config = statusConfig[device.status];
  const DeviceIcon = device.device_type.toLowerCase().includes("kiosk") ? Monitor : Tablet;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <DeviceIcon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{device.device_type}</span>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", config.color)} />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground font-mono">{device.serial_number}</span>
          <Badge 
            variant="outline" 
            className={cn(
              "text-2xs px-1.5 py-0",
              device.is_daze_owned 
                ? "border-primary/30 text-primary" 
                : "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            {device.is_daze_owned ? "Daze" : "Property"}
          </Badge>
        </div>
        {device.last_check_in && (
          <p className="text-2xs text-muted-foreground/70 mt-1">
            Last check-in: {formatTimeAgo(new Date(device.last_check_in))}
          </p>
        )}
      </div>
    </div>
  );
}

function RealActivityItem({ log }: { log: ActivityLog }) {
  const config = getActionConfig(log.action);
  const { userName, actionText } = formatAction(log);
  const Icon = config.icon;
  const initials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true });

  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border/50 last:hidden" />
      
      <div className="relative flex-shrink-0">
        <Avatar className="h-9 w-9 ring-2 ring-background">
          <AvatarImage src={log.profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-background",
          config.bgColor
        )}>
          <Icon className={cn("h-2.5 w-2.5", config.color)} strokeWidth={2.5} />
        </div>
      </div>

      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm leading-snug">
          <span className="font-semibold text-foreground">{userName}</span>
          {" "}
          <span className="text-muted-foreground">{actionText}</span>
        </p>
        <p className="text-2xs text-muted-foreground/70 mt-1">
          {timeAgo}
        </p>
      </div>
    </div>
  );
}

export function HotelDetailPanel({ hotel, open, onOpenChange }: ClientDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("portal");
  const [isNewDeviceOpen, setIsNewDeviceOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const logoUpload = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop() || "png";
      const path = `brands/${hotel!.id}/admin-logo-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(path);
      const { error: dbError } = await supabase
        .from("clients")
        .update({ logo_url: publicUrl })
        .eq("id", hotel!.id);
      if (dbError) throw dbError;
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-with-details"] });
    },
  });

  const { data: clientDevices = [], isLoading: devicesLoading, isError: devicesError } = useQuery({
    queryKey: ["client-devices", hotel?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("client_id", hotel!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DeviceRow[];
    },
    enabled: !!hotel?.id && open,
  });

  const { data: contacts = [], isLoading: contactsLoading, isError: contactsError } = useQuery({
    queryKey: ["client-contacts", hotel?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_contacts")
        .select("*")
        .eq("client_id", hotel!.id)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hotel?.id && open,
  });

  const { data: activityLogs = [], isLoading: activityLoading, isError: activityError } = useActivityLogs(
    hotel?.id && open ? hotel.id : null
  );

  if (!hotel) return null;

  const initials = hotel.name.substring(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl overflow-y-auto"
      >
        <SheetHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative group/logo">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={hotel.logo_url || undefined} />
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUpload.isPending}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity ring-2 ring-background hover:bg-primary/90 disabled:opacity-50"
                aria-label="Change logo"
              >
                {logoUpload.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Pencil className="h-3 w-3" />
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) logoUpload.mutate(file);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">{hotel.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                {hotel.client_code && (
                  <Badge variant="outline" className="text-2xs font-mono">
                    {hotel.client_code}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-2xs capitalize">
                  {hotel.phase.replace("_", " ")}
                </Badge>
                {hotel.hasBlocker && (
                  <Badge variant="destructive" className="text-2xs">
                    Blocked
                  </Badge>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full grid grid-cols-5 h-10">
            <TabsTrigger value="portal" className="gap-1.5 text-xs w-full flex justify-center">
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Portal</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5 text-xs w-full flex justify-center">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-1.5 text-xs w-full flex justify-center">
              <Cpu className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Devices</span>
              {clientDevices.length > 0 && (
                <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-2xs font-semibold">
                  {clientDevices.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs w-full flex justify-center">
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5 text-xs w-full flex justify-center">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Docs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portal" className="mt-4">
            <PortalManagementPanel
              clientId={hotel.id}
              currentLogoUrl={hotel.logo_url}
              currentBrandPalette={hotel.brand_palette as string[] | null}
              onNavigateToDocsTab={() => setActiveTab("documents")}
            />
          </TabsContent>

          <TabsContent value="contacts" className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                variant="default"
                className="gap-1.5"
                onClick={() => {
                  setEditingContact(null);
                  setContactModalOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                New Contact
              </Button>
            </div>
            {contactsLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : contactsError ? (
              <div className="text-center py-8 text-destructive text-sm">
                <p>Failed to load contacts</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No contacts yet</p>
                <p className="text-xs mt-1">Add contacts for this client</p>
              </div>
            ) : (
              contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={() => {
                    setEditingContact(contact);
                    setContactModalOpen(true);
                  }}
                />
              ))
            )}
            <ContactFormModal
              open={contactModalOpen}
              onOpenChange={setContactModalOpen}
              clientId={hotel.id}
              contact={editingContact}
            />
          </TabsContent>

          <TabsContent value="devices" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {clientDevices.length} device{clientDevices.length !== 1 ? "s" : ""}
              </span>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsNewDeviceOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                New Device
              </Button>
            </div>
            {devicesLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading devices…</div>
            ) : devicesError ? (
              <div className="text-center py-8 text-destructive text-sm">
                <p>Failed to load devices</p>
              </div>
            ) : clientDevices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No devices assigned</p>
                <p className="text-xs mt-1">Add hardware for this client</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientDevices.map((device) => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            )}
            <NewDeviceModal
              open={isNewDeviceOpen}
              onOpenChange={setIsNewDeviceOpen}
              clientId={hotel.id}
              clientName={hotel.name}
            />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityError ? (
              <div className="text-center py-8 text-destructive text-sm">
                <p>Failed to load activity</p>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No activity yet</p>
                <p className="text-xs mt-1">Actions will appear here as your team works</p>
              </div>
            ) : (
              <div className="space-y-0">
                {activityLogs.map((log) => (
                  <RealActivityItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <DocumentUploadSection clientId={hotel.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
