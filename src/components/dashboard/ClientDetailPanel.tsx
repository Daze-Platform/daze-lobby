import { useState } from "react";
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
import { 
  Users, 
  Cpu, 
  Activity,
  FileText,
  Mail,
  Phone,
  Tablet,
  Monitor,
  CheckCircle2,
  Upload,
  FileSignature,
  Palette,
  Settings2,
} from "lucide-react";
import { DocumentUploadSection } from "./DocumentUploadSection";
import { PortalManagementPanel } from "./portal-management";
import { cn } from "@/lib/utils";
import type { Client } from "@/hooks/useClients";

interface ClientDetailPanelProps {
  hotel: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data types
interface MockContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  is_primary: boolean;
}

interface MockDevice {
  id: string;
  device_type: string;
  serial_number: string;
  status: "online" | "offline" | "maintenance";
  last_check_in: string;
  is_daze_owned: boolean;
}

interface MockActivity {
  id: string;
  action: string;
  user_name: string;
  description: string;
  created_at: string;
}

// Mock data
const mockContacts: MockContact[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "General Manager",
    email: "sarah.johnson@grandhotel.com",
    phone: "+1 (555) 123-4567",
    is_primary: true,
  },
  {
    id: "2",
    name: "Mike Chen",
    role: "IT Director",
    email: "mike.chen@grandhotel.com",
    phone: "+1 (555) 234-5678",
    is_primary: false,
  },
  {
    id: "3",
    name: "Lisa Rodriguez",
    role: "F&B Manager",
    email: "lisa.r@grandhotel.com",
    phone: "+1 (555) 345-6789",
    is_primary: false,
  },
];

const mockDevices: MockDevice[] = [
  {
    id: "1",
    device_type: "iPad Pro 12.9\"",
    serial_number: "DZ-2024-001",
    status: "online",
    last_check_in: "5 minutes ago",
    is_daze_owned: true,
  },
  {
    id: "2",
    device_type: "iPad Air",
    serial_number: "DZ-2024-002",
    status: "online",
    last_check_in: "12 minutes ago",
    is_daze_owned: true,
  },
  {
    id: "3",
    device_type: "Surface Go 3",
    serial_number: "PROP-SG-001",
    status: "offline",
    last_check_in: "2 days ago",
    is_daze_owned: false,
  },
  {
    id: "4",
    device_type: "iPad Mini",
    serial_number: "DZ-2024-003",
    status: "maintenance",
    last_check_in: "1 hour ago",
    is_daze_owned: true,
  },
];

const mockActivity: MockActivity[] = [
  {
    id: "1",
    action: "legal_signed",
    user_name: "Sarah Johnson",
    description: "signed the Pilot Agreement",
    created_at: "2 hours ago",
  },
  {
    id: "2",
    action: "logo_uploaded",
    user_name: "Mike Chen",
    description: "uploaded hotel logo",
    created_at: "5 hours ago",
  },
  {
    id: "3",
    action: "brand_updated",
    user_name: "Sarah Johnson",
    description: "updated brand colors",
    created_at: "1 day ago",
  },
  {
    id: "4",
    action: "task_completed",
    user_name: "Lisa Rodriguez",
    description: "completed venue setup",
    created_at: "1 day ago",
  },
  {
    id: "5",
    action: "menu_uploaded",
    user_name: "Lisa Rodriguez",
    description: "uploaded menu for Lobby Bar",
    created_at: "2 days ago",
  },
  {
    id: "6",
    action: "task_completed",
    user_name: "Mike Chen",
    description: "completed POS integration",
    created_at: "3 days ago",
  },
];

// Helper components
function ContactCard({ contact }: { contact: MockContact }) {
  const initials = contact.name.split(" ").map(n => n[0]).join("").toUpperCase();
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{contact.role}</p>
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{contact.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{contact.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ device }: { device: MockDevice }) {
  const statusConfig = {
    online: { color: "bg-emerald-500", label: "Online" },
    offline: { color: "bg-destructive", label: "Offline" },
    maintenance: { color: "bg-amber-500", label: "Maintenance" },
  };
  
  const config = statusConfig[device.status];
  const DeviceIcon = device.device_type.toLowerCase().includes("surface") ? Monitor : Tablet;
  
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
        <p className="text-2xs text-muted-foreground/70 mt-1">
          Last check-in: {device.last_check_in}
        </p>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: MockActivity }) {
  const actionConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    legal_signed: { icon: FileSignature, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    task_completed: { icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    brand_updated: { icon: Palette, color: "text-primary", bgColor: "bg-primary/10" },
    logo_uploaded: { icon: Upload, color: "text-primary", bgColor: "bg-primary/10" },
    menu_uploaded: { icon: Upload, color: "text-violet-500", bgColor: "bg-violet-500/10" },
  };
  
  const config = actionConfig[activity.action] || { 
    icon: Activity, 
    color: "text-muted-foreground", 
    bgColor: "bg-muted" 
  };
  const Icon = config.icon;
  const initials = activity.user_name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      {/* Timeline connector */}
      <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border/50 last:hidden" />
      
      <div className="relative flex-shrink-0">
        <Avatar className="h-9 w-9 ring-2 ring-background">
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
          <span className="font-semibold text-foreground">{activity.user_name}</span>
          {" "}
          <span className="text-muted-foreground">{activity.description}</span>
        </p>
        <p className="text-2xs text-muted-foreground/70 mt-1">
          {activity.created_at}
        </p>
      </div>
    </div>
  );
}

export function HotelDetailPanel({ hotel, open, onOpenChange }: ClientDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("portal");

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
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={hotel.logo_url || undefined} />
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">{hotel.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
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
            <TabsTrigger value="portal" className="gap-1.5 text-xs">
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Portal</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-1.5 text-xs">
              <Cpu className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs">
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5 text-xs">
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
            {mockContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </TabsContent>

          <TabsContent value="devices" className="mt-4 space-y-2">
            {mockDevices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="space-y-0">
              {mockActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <DocumentUploadSection clientId={hotel.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
