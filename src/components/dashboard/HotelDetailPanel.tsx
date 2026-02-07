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
  Building2
} from "lucide-react";
import { DocumentUploadSection } from "./DocumentUploadSection";
import type { Hotel } from "@/hooks/useHotels";

interface HotelDetailPanelProps {
  hotel: Hotel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HotelDetailPanel({ hotel, open, onOpenChange }: HotelDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("documents");

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
          <TabsList className="w-full grid grid-cols-4 h-10">
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

          <TabsContent value="contacts" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Contacts section coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Devices section coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Activity section coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <DocumentUploadSection hotelId={hotel.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
