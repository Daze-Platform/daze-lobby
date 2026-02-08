import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Check,
  Cloud,
  File,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface DocumentUploadSectionProps {
  clientId: string;
}

interface Document {
  id: string;
  display_name: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  category: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: "Legal", label: "Legal" },
  { value: "Brand", label: "Brand" },
  { value: "Venue", label: "Venue" },
  { value: "Contract", label: "Contract" },
  { value: "Other", label: "Other" },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Legal: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  Brand: { bg: "bg-primary/10", text: "text-primary" },
  Venue: { bg: "bg-violet-500/10", text: "text-violet-600" },
  Contract: { bg: "bg-amber-500/10", text: "text-amber-600" },
  Other: { bg: "bg-muted", text: "text-muted-foreground" },
};

export function DocumentUploadSection({ clientId }: DocumentUploadSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("Other");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Fetch documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (doc: Document) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("hotel-documents")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", clientId] });
      toast.success("Document deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setDisplayName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setDisplayName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setDisplayName("");
    setCategory("Other");
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !displayName.trim()) {
      toast.error("Please provide a file and display name");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file path
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;

      // Simulate progress (Supabase doesn't provide real progress for small files)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 85));
      }, 100);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("hotel-documents")
        .upload(filePath, selectedFile);

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      setUploadProgress(95);

      // Insert record into documents table
      const { error: dbError } = await supabase.from("documents").insert({
        client_id: clientId,
        display_name: displayName.trim(),
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        category,
      });

      if (dbError) throw dbError;

      setUploadProgress(100);
      setUploadComplete(true);

      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ["documents", clientId] });

      toast.success("Document uploaded successfully!");

      // Reset form after brief delay
      setTimeout(() => {
        clearSelection();
      }, 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("hotel-documents")
        .download(doc.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloading ${doc.display_name}...`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Download failed";
      toast.error(message);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </h3>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer",
            "border-slate-200 dark:border-slate-700",
            isDragging && "border-primary bg-primary/5 scale-[1.02]",
            selectedFile && "border-solid border-primary/50 bg-primary/5 cursor-default"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          />

          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 text-center"
              >
                <div className="relative">
                  <Cloud className="h-10 w-10 text-muted-foreground/50" />
                  <FileText className="h-5 w-5 text-primary absolute -bottom-1 -right-1" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isDragging ? "Drop file here" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, XLS, PNG, JPG up to 10MB
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="selected"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Selected file info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <File className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSelection();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Progress bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <Progress 
                      value={uploadProgress} 
                      className={cn(
                        "h-2 transition-all",
                        uploadComplete && "[&>div]:bg-success"
                      )}
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      {uploadComplete ? (
                        <span className="text-success flex items-center justify-center gap-1">
                          <Check className="h-3 w-3" />
                          Upload complete!
                        </span>
                      ) : (
                        `Uploading... ${uploadProgress}%`
                      )}
                    </p>
                  </div>
                )}

                {/* Form fields */}
                {!isUploading && (
                  <div className="grid gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-xs">
                        Document Display Name
                      </Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter display name"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-xs">
                        Category
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={!displayName.trim()}
                      className="w-full rounded-full min-h-[44px] bg-primary hover:bg-primary/90"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Documents Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents
          {documents && documents.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({documents.length})
            </span>
          )}
        </h3>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Loading documents...
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-medium">Name</TableHead>
                  <TableHead className="text-xs font-medium hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-xs font-medium hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-xs font-medium w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const colors = CATEGORY_COLORS[doc.category || "Other"] || CATEGORY_COLORS.Other;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate max-w-[150px]">
                            {doc.display_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-2xs font-medium",
                          colors.bg,
                          colors.text
                        )}>
                          {doc.category || "Other"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                        {format(new Date(doc.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#0EA5E9] hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteMutation.mutate(doc)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
