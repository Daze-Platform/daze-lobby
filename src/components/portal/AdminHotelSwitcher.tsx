import { useClient } from "@/contexts/ClientContext";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Eye } from "lucide-react";

export function AdminHotelSwitcher() {
  const { 
    allClients, 
    isLoadingAllClients, 
    selectedClientId, 
    setSelectedClientId,
    isAdminViewing
  } = useClient();

  if (isLoadingAllClients) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Admin View Badge */}
      {isAdminViewing && (
        <Badge 
          variant="secondary" 
          className="gap-1.5 bg-warning/10 text-warning border border-warning/20 font-medium text-xs px-2.5 py-1 shrink-0"
        >
          <Eye className="w-3 h-3" strokeWidth={2} />
          <span className="hidden sm:inline">Admin View</span>
        </Badge>
      )}
      
      {/* Client Selector */}
      <Select
        value={selectedClientId || ""}
        onValueChange={(value) => setSelectedClientId(value || null)}
      >
        <SelectTrigger className="w-[180px] lg:w-[220px] h-9 bg-background/80 border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <SelectValue placeholder="Select client..." className="truncate" />
          </div>
        </SelectTrigger>
        <SelectContent align="end" className="w-[280px]">
          {allClients.map((c) => (
            <SelectItem key={c.id} value={c.id} className="py-2.5">
              <div className="flex items-center justify-between w-full gap-3">
                <span className="truncate font-medium">{c.name}</span>
                <Badge 
                  variant="outline" 
                  className="shrink-0 text-2xs capitalize font-normal"
                >
                  {c.phase.replace("_", " ")}
                </Badge>
              </div>
            </SelectItem>
          ))}
          {allClients.length === 0 && (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No clients found
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
