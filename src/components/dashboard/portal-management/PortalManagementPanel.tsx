import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Palette, MapPin, Loader2, ExternalLink, Link2, Copy, Check, Trash2, Plus } from "lucide-react";
import { AdminDocumentUpload } from "./AdminDocumentUpload";
import { AdminBrandPosControls } from "./AdminBrandPosControls";
import { AdminVenuePresets } from "./AdminVenuePresets";
import { toast } from "sonner";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

interface PortalManagementPanelProps {
  clientId: string;
  clientSlug?: string;
  primaryContact?: Tables<"client_contacts">;
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
  clientSlug,
  primaryContact,
  currentLogoUrl,
  currentBrandPalette,
  onNavigateToDocsTab,
}: PortalManagementPanelProps) {
  const [copied, setCopied] = useState(false);
  const [generalDocName, setGeneralDocName] = useState("");
  const queryClient = useQueryClient();
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

  const generalDocs = documents?.filter((d) => d.category === "General") || [];

  const deleteGeneralDoc = useMutation({
    mutationFn: async (doc: Document) => {
      await supabase.storage.from("hotel-documents").remove([doc.file_path]);
      await supabase.from("documents").delete().eq("id", doc.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", clientId] });
      queryClient.invalidateQueries({ queryKey: ["admin-documents", clientId] });
      toast.success("Document removed");
    },
    onError: () => toast.error("Failed to remove document"),
  });

  const isLoading = isLoadingDocs || isLoadingPos;

  // Build invite URL
  const inviteUrl = (() => {
    if (!clientSlug) return null;
    const params = new URLSearchParams();
    if (primaryContact?.email) params.set("email", primaryContact.email);
    if (primaryContact?.name) params.set("name", primaryContact.name);
    const query = params.toString();
    return query
      ? `${window.location.origin}/portal/${clientSlug}?${query}`
      : `${window.location.origin}/portal/${clientSlug}`;
  })();

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

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

      {/* Invite Link Card */}
      {inviteUrl && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Portal Invite Link</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground truncate">
            /portal/{clientSlug}
          </p>
          {primaryContact && (
            <p className="text-xs text-muted-foreground">
              For: {primaryContact.name}
              {primaryContact.email && (
                <span className="text-muted-foreground/70"> ({primaryContact.email})</span>
              )}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied!" : primaryContact?.email ? "Copy Invite Link" : "Copy Link (no email)"}
          </Button>
        </div>
      )}

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-11">
          <TabsTrigger value="documents" className="text-xs gap-1.5 w-full flex justify-center">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="brand-pos" className="text-xs gap-1.5 w-full flex justify-center">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Brand/POS</span>
          </TabsTrigger>
          <TabsTrigger value="venues" className="text-xs gap-1.5 w-full flex justify-center">
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

          {/* General Documents Section */}
          <div className="rounded-lg border border-border/50 p-4 space-y-3">
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Additional Documents
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload any other documents to share with this client
              </p>
            </div>

            {/* List of existing general docs */}
            {generalDocs.length > 0 && (
              <div className="space-y-1.5">
                {generalDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{doc.display_name}</p>
                        <p className="text-2xs text-muted-foreground">
                          {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                      onClick={() => deleteGeneralDoc.mutate(doc)}
                      disabled={deleteGeneralDoc.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom name input + upload */}
            <div className="space-y-2">
              <Input
                placeholder="Document name (optional)"
                value={generalDocName}
                onChange={(e) => setGeneralDocName(e.target.value)}
                className="h-8 text-xs"
              />
              <AdminDocumentUpload
                clientId={clientId}
                documentType="general"
                title="Upload Document"
                description=""
                customDisplayName={generalDocName}
                onCustomDisplayNameChange={setGeneralDocName}
              />
            </div>
          </div>

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
