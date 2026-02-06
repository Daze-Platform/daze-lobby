import { useHotel } from "@/contexts/HotelContext";
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
    allHotels, 
    isLoadingAllHotels, 
    selectedHotelId, 
    setSelectedHotelId,
    hotel,
    isAdminViewing
  } = useHotel();

  if (isLoadingAllHotels) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        Loading hotels...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isAdminViewing && (
        <Badge variant="secondary" className="gap-1.5 bg-amber-100 text-amber-800 border-amber-200">
          <Eye className="w-3 h-3" />
          Admin View
        </Badge>
      )}
      
      <Select
        value={selectedHotelId || ""}
        onValueChange={(value) => setSelectedHotelId(value || null)}
      >
        <SelectTrigger className="w-[250px] h-9">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select a hotel to view..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {allHotels.map((h) => (
            <SelectItem key={h.id} value={h.id}>
              <div className="flex items-center justify-between w-full gap-3">
                <span className="truncate">{h.name}</span>
                <Badge 
                  variant="outline" 
                  className="shrink-0 text-xs capitalize"
                >
                  {h.phase.replace("_", " ")}
                </Badge>
              </div>
            </SelectItem>
          ))}
          {allHotels.length === 0 && (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No hotels found
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
