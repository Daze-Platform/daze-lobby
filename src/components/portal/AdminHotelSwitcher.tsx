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
    client,
    isAdminViewing
  } = useClient();

  if (isLoadingAllClients) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        Loading clients...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {isAdminViewing && (
        <Badge variant="secondary" className="hidden sm:flex gap-1.5 bg-amber-100 text-amber-800 border-amber-200">
          <Eye className="w-3 h-3" />
          Admin View
        </Badge>
      )}
      
      <Select
        value={selectedClientId || ""}
        onValueChange={(value) => setSelectedClientId(value || null)}
      >
        <SelectTrigger className="w-full sm:w-[200px] lg:w-[250px] h-9 min-h-[44px]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select client..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {allClients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <div className="flex items-center justify-between w-full gap-3">
                <span className="truncate">{c.name}</span>
                <Badge 
                  variant="outline" 
                  className="shrink-0 text-xs capitalize"
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
