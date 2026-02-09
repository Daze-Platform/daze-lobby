import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Check, Loader2, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface AdminDocumentUploadProps {
  clientId: string;
  documentType: "pilot_agreement" | "security_docs";
  title: string;
  description: string;
  existingDocument?: {
    id: string;
    display_name: string;
    file_path: string;
    created_at: string;
  } | null;
}

export function AdminDocumentUpload({
  clientId,
  documentType,
  title,
  description,
  existingDocument,
}: AdminDocumentUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categoryMap = {
    pilot_agreement: "Contract",
    security_docs: "Legal",
  };

  const displayNameMap = {
    pilot_agreement: "Pilot Agreement",
    security_docs: "Security Documentation",
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      // Delete existing document if present
      if (existingDocument) {
        await supabase.storage
          .from("hotel-documents")
          .remove([existingDocument.file_path]);
        
        await supabase
          .from("documents")
          .delete()
          .eq("id", existingDocument.id);
      }

      // Generate file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${documentType}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from("hotel-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert document record
      const { error: dbError } = await supabase.from("documents").insert({
        client_id: clientId,
        display_name: displayNameMap[documentType],
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        category: categoryMap[documentType],
      });

      if (dbError) throw dbError;

      return filePath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", clientId] });
      queryClient.invalidateQueries({ queryKey: ["admin-documents", clientId] });
      toast.success(`${title} uploaded successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload: ${error.message}`);
    },
    onSettled: () => {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDownload = async () => {
    if (!existingDocument) return;
    
    try {
      const { data, error } = await supabase.storage
        .from("hotel-documents")
        .download(existingDocument.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = existingDocument.display_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download document");
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingDocument) return;
      
      await supabase.storage
        .from("hotel-documents")
        .remove([existingDocument.file_path]);
      
      await supabase
        .from("documents")
        .delete()
        .eq("id", existingDocument.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", clientId] });
      queryClient.invalidateQueries({ queryKey: ["admin-documents", clientId] });
      toast.success("Document removed");
    },
    onError: () => {
      toast.error("Failed to remove document");
    },
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
        />

        {existingDocument ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{existingDocument.display_name}</p>
                <p className="text-2xs text-muted-foreground">
                  Uploaded {format(new Date(existingDocument.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className={cn(
              "w-full h-20 border-dashed",
              isUploading && "pointer-events-none"
            )}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to upload</span>
              </div>
            )}
          </Button>
        )}

        {existingDocument && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-3.5 w-3.5 mr-2" />
            Replace Document
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
