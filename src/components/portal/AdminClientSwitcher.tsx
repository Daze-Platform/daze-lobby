import { useNavigate } from "react-router-dom";
import { useClient } from "@/contexts/ClientContext";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Map phase to display label
const phaseLabels: Record<string, string> = {
  onboarding: "Onboarding",
  reviewing: "In Review",
  pilot_live: "Pilot Live",
  contracted: "Contracted",
};

// Map phase to badge style
const phaseStyles: Record<string, string> = {
  onboarding: "bg-primary/10 text-primary border-primary/20",
  reviewing: "bg-warning/10 text-warning border-warning/20",
  pilot_live: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  contracted: "bg-violet-500/10 text-violet-600 border-violet-500/20",
};

export function AdminClientSwitcher() {
  const navigate = useNavigate();
  const { 
    allClients, 
    isLoadingAllClients, 
    selectedClientId, 
    setSelectedClientId,
    client,
  } = useClient();

  // Fetch slugs for all clients so we can navigate by slug
  const { data: clientSlugs = {} } = useQuery({
    queryKey: ["client-slugs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, client_slug");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach(c => {
        if (c.client_slug) map[c.id] = c.client_slug;
      });
      return map;
    },
    enabled: allClients.length > 0,
  });

  if (isLoadingAllClients) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">Loading...</span>
      </div>
    );
  }

  const selectedClient = allClients.find(c => c.id === selectedClientId) || client;
  const progress = selectedClient?.onboarding_progress ?? 0;
  const phase = selectedClient?.phase || "onboarding";

  const handleClientChange = (value: string) => {
    const slug = clientSlugs[value];
    if (slug) {
      setSelectedClientId(value);
      navigate(`/admin/portal/${slug}`);
    } else {
      setSelectedClientId(value || null);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Client Selector */}
      <Select
        value={selectedClientId || ""}
        onValueChange={handleClientChange}
      >
        <SelectTrigger className="w-[140px] lg:w-[180px] h-9 bg-background/80 border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="truncate text-sm">
              {selectedClient?.name || "Select client..."}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent align="end" className="w-[340px] z-[100]">
          {allClients.map((c) => (
            <SelectItem key={c.id} value={c.id} className="py-2.5">
              <div className="flex items-center justify-between w-full gap-3">
                <span className="truncate font-medium">{c.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{c.onboarding_progress ?? 0}%</span>
                  <Badge 
                    variant="outline" 
                    className={`text-2xs capitalize font-normal ${phaseStyles[c.phase] || ""}`}
                  >
                    {phaseLabels[c.phase] || c.phase.replace("_", " ")}
                  </Badge>
                </div>
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

      {/* Client Progress Indicator - only when a client is selected */}
      {selectedClient && (
        <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-border/50">
          <Badge 
            variant="outline" 
            className={`font-medium text-xs px-2.5 py-1 ${phaseStyles[phase] || ""}`}
          >
            {phaseLabels[phase] || phase.replace("_", " ")}
          </Badge>
          
          <div className="flex items-center gap-2 min-w-[100px]">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <Progress value={progress} className="h-1.5 w-16" />
            <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
