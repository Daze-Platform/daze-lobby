import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Check, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoVariant {
  type: "dark" | "light" | "icon";
  label: string;
  description: string;
  file?: File;
  preview?: string;
}

interface MultiLogoUploadProps {
  onLogosChange: (logos: Record<string, File>) => void;
}

export function MultiLogoUpload({ onLogosChange }: MultiLogoUploadProps) {
  const [logos, setLogos] = useState<LogoVariant[]>([
    { type: "dark", label: "Dark Version", description: "For light backgrounds" },
    { type: "light", label: "Light Version", description: "For dark backgrounds" },
    { type: "icon", label: "Icon/Favicon", description: "Square format, 512x512+" },
  ]);

  const handleFileChange = (type: "dark" | "light" | "icon", file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogos((prev) => {
        const updated = prev.map((logo) =>
          logo.type === type
            ? { ...logo, file, preview: e.target?.result as string }
            : logo
        );
        
        // Notify parent of all files
        const fileMap: Record<string, File> = {};
        updated.forEach((l) => {
          if (l.file) fileMap[l.type] = l.file;
        });
        onLogosChange(fileMap);
        
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Image className="w-4 h-4" />
        Logo Variants
      </Label>

      <div className="grid gap-4">
        {logos.map((logo) => (
          <div
            key={logo.type}
            className={cn(
              "relative border rounded-lg p-4 transition-all",
              logo.file ? "border-primary bg-primary/5" : "border-dashed"
            )}
          >
            <div className="flex items-start gap-4">
              {/* Preview / Upload Zone */}
              <label
                className={cn(
                  "flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors",
                  logo.type === "light" ? "bg-foreground" : "bg-muted",
                  "hover:border-primary"
                )}
              >
                {logo.preview ? (
                  <img
                    src={logo.preview}
                    alt={logo.label}
                    className="w-full h-full object-contain rounded-lg p-1"
                  />
                ) : (
                  <Upload className={cn(
                    "w-6 h-6",
                    logo.type === "light" ? "text-muted" : "text-muted-foreground"
                  )} />
                )}
                <Input
                  type="file"
                  accept=".png,.svg,.jpg,.jpeg"
                  className="sr-only"
                  onChange={(e) => handleFileChange(logo.type, e.target.files?.[0])}
                />
              </label>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{logo.label}</p>
                  {logo.file && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <Check className="w-3 h-3" />
                      Uploaded
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {logo.description}
                </p>
                {logo.file && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {logo.file.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Accepted formats: PNG, SVG, JPG. Recommended: SVG for best quality.
      </p>
    </div>
  );
}
