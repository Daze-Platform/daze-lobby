import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/contexts/ClientContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Loader2, FolderOpen, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  Legal: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  Contract: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  Brand: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Guidelines: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  Financial: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Other: "bg-muted text-muted-foreground",
};

interface PortalDocumentsProps {
  clientIdOverride?: string | null;
}

export function PortalDocuments({ clientIdOverride }: PortalDocumentsProps = {}) {
  const clientContext = useClient();
  const resolvedClientId = clientIdOverride || clientContext.clientId;

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", resolvedClientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", resolvedClientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!resolvedClientId,
  });

  const isPreviewable = (mimeType: string | null): boolean => {
    if (!mimeType) return false;
    return mimeType === "application/pdf" || mimeType.startsWith("image/");
  };

  const handlePreview = async (filePath: string) => {
    // Open window IMMEDIATELY in user gesture context to avoid popup blocker
    const newWindow = window.open('about:blank', '_blank');
    
    if (!newWindow) {
      toast.error("Please allow popups for this site to preview documents");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("hotel-documents")
        .createSignedUrl(filePath, 300); // 5 min expiry for viewing

      if (error) throw error;
      
      // Navigate the already-opened window to the signed URL
      newWindow.location.href = data.signedUrl;
    } catch (error) {
      console.error("Preview error:", error);
      newWindow.close(); // Close the blank tab on error
      toast.error("Failed to preview document");
    }
  };

  const handleDownload = async (filePath: string, displayName: string) => {
    // Open window IMMEDIATELY in user gesture context to avoid popup blocker
    const newWindow = window.open('about:blank', '_blank');
    
    if (!newWindow) {
      toast.error("Please allow popups for this site to download documents");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("hotel-documents")
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      newWindow.location.href = data.signedUrl;
    } catch (error) {
      console.error("Download error:", error);
      newWindow.close(); // Close the blank tab on error
      toast.error("Failed to download document");
    }
  };

  const getCategoryColor = (category: string | null) => {
    return CATEGORY_COLORS[category || "Other"] || CATEGORY_COLORS.Other;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="entrance-hero">
        <h1 className="font-display text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-1 sm:mb-3">
          Documents
        </h1>
        <p className="text-xs sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
          Access your contracts, agreements, and important files uploaded by the Daze team.
        </p>
      </div>

      <Card className="entrance-content">
        <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
          <span className="label-micro">Library</span>
          <CardTitle className="text-base sm:text-xl">Your Documents</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {documents && documents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Document</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="cursor-default hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">
                              {doc.display_name}
                            </p>
                            <div className="flex items-center gap-2 sm:hidden">
                              <Badge
                                variant="secondary"
                                className={`text-2xs ${getCategoryColor(doc.category)}`}
                              >
                                {doc.category || "Other"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="secondary"
                          className={getCategoryColor(doc.category)}
                        >
                          {doc.category || "Other"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {format(new Date(doc.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPreviewable(doc.mime_type) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(doc.file_path)}
                              className="min-h-[44px] sm:min-h-0"
                            >
                              <Eye className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Preview</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc.file_path, doc.display_name)}
                            className="min-h-[44px] sm:min-h-0"
                          >
                            <Download className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 sm:py-16 text-center">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-base sm:text-lg mb-2">No documents yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Documents uploaded by the Daze team will appear here. Check back soon!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
