import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Palette, MapPin, Loader2, ExternalLink } from "lucide-react";
import { AdminDocumentUpload } from "./AdminDocumentUpload";
import { AdminBrandPosControls } from "./AdminBrandPosControls";
import { AdminVenuePresets } from "./AdminVenuePresets";

interface PortalManagementPanelProps {
  clientId: string;
  currentLogoUrl?: string | null;
  currentBrandPalette?: string[] | null;
  onNavigateToDocsTab?: () => void;
}

interface Document {
  id: string;
  display_name: string;
  file_path: string;
  category: string | null;
  created_at: string;
}

export function PortalManagementPanel({
  clientId,
  currentLogoUrl,
  currentBrandPalette,
  onNavigateToDocsTab,
}: PortalManagementPanelProps) {
  // Fetch existing documents to check for pilot agreement and security docs
  const { data: documents, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["admin-documents", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, display_name, file_path, category, created_at")
        .eq("client_id", clientId);

      if (error) throw error;
      return data as Document[];
    },
  });

  // Fetch POS task data for existing instructions
  const { data: posTask, isLoading: isLoadingPos } = useQuery({
    queryKey: ["admin-pos-task", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_tasks")
        .select("data")
        .eq("client_id", clientId)
        .eq("task_key", "pos")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.data as { admin_instructions?: string; provider?: string } | null;
    },
  });

  const pilotAgreement = documents?.find(
    (d) => d.display_name === "Pilot Agreement" || d.category === "Contract"
  );
  
  const securityDocs = documents?.find(
    (d) => d.display_name === "Security Documentation" || d.category === "Legal"
  );

  const isLoading = isLoadingDocs || isLoadingPos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="pb-2">
        <h3 className="text-sm font-semibold">Portal Management</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Prepopulate and manage this client's portal content
        </p>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="documents" className="text-xs gap-1.5 w-full">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="brand-pos" className="text-xs gap-1.5 w-full">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Brand/POS</span>
          </TabsTrigger>
          <TabsTrigger value="venues" className="text-xs gap-1.5 w-full">
            <MapPin className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Venues</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4 space-y-4">
          <AdminDocumentUpload
            clientId={clientId}
            documentType="pilot_agreement"
            title="Pilot Agreement"
            description="Upload the signed pilot agreement for this client"
            existingDocument={pilotAgreement}
          />
          <AdminDocumentUpload
            clientId={clientId}
            documentType="security_docs"
            title="Security Documentation"
            description="Upload security compliance documents"
            existingDocument={securityDocs}
          />
          
          {onNavigateToDocsTab && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={onNavigateToDocsTab}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              View All Documents in Docs Tab
            </Button>
          )}
        </TabsContent>

        <TabsContent value="brand-pos" className="mt-4">
          <AdminBrandPosControls
            clientId={clientId}
            currentLogoUrl={currentLogoUrl}
            currentBrandPalette={currentBrandPalette}
            currentPosInstructions={posTask?.admin_instructions}
            currentPosProvider={posTask?.provider as string | undefined}
          />
        </TabsContent>

        <TabsContent value="venues" className="mt-4">
          <AdminVenuePresets clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
