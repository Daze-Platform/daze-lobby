import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandDocumentUploadProps {
  onUpload: (file: File) => void;
  existingUrl?: string | null;
  isUploading?: boolean;
  label?: string;
  description?: string;
  accept?: string;
}

export function BrandDocumentUpload({
  onUpload,
  existingUrl,
  isUploading = false,
  label = "Color Palette Document",
  description = "Upload your brand guidelines or color palette document (PDF, PNG, JPG)",
  accept = ".pdf,.png,.jpg,.jpeg,.webp"
}: BrandDocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    onUpload(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const hasFile = selectedFile || existingUrl;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-muted-foreground">{description}</p>
      
      {hasFile ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {selectedFile?.name || "Color palette document"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isUploading ? "Uploading..." : "Uploaded successfully"}
            </p>
          </div>
          {!isUploading && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, PNG, JPG up to 10MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}