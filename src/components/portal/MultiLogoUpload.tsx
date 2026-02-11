import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Check, Image, AlertCircle, Moon, Sun, Images, X, Type, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateImageFile } from "@/lib/fileValidation";
import { toast } from "sonner";

type LogoVariantType = "dark" | "light" | "icon" | "wordmark" | "alternate";

interface LogoVariant {
  type: LogoVariantType;
  label: string;
  description: string;
  file?: File;
  preview?: string;
  existingUrl?: string;
}

interface MultiLogoUploadProps {
  onLogosChange: (logos: Record<string, File>) => void;
  onLogoRemove?: (variant: string) => void;
  existingUrls?: Record<string, string>;
  existingFilenames?: Record<string, string>;
}

const createInitialLogos = (existingUrls?: Record<string, string>): LogoVariant[] => [
  { type: "dark", label: "Dark Version", description: "For light backgrounds", existingUrl: existingUrls?.dark },
  { type: "light", label: "Light Version", description: "For dark backgrounds", existingUrl: existingUrls?.light },
  { type: "icon", label: "Additional Logos", description: "For marketing materials & guest interfaces", existingUrl: existingUrls?.icon },
  { type: "wordmark", label: "Wordmark / Text Logo", description: "Text-based logo version", existingUrl: existingUrls?.wordmark },
  { type: "alternate", label: "Alternate Logo", description: "Secondary or seasonal variant", existingUrl: existingUrls?.alternate },
];

export function MultiLogoUpload({ onLogosChange, onLogoRemove, existingUrls, existingFilenames }: MultiLogoUploadProps) {
  const [logos, setLogos] = useState<LogoVariant[]>(() => createInitialLogos(existingUrls));

  // Sync existingUrls when they change (e.g., after data loads from DB)
  useEffect(() => {
    if (existingUrls) {
      setLogos(prev => prev.map(logo => ({
        ...logo,
        existingUrl: existingUrls[logo.type] || logo.existingUrl,
      })));
    }
  }, [existingUrls]);

  const handleRemoveLogo = (type: LogoVariantType) => {
    setLogos((prev) => prev.map((logo) =>
      logo.type === type ? { ...logo, file: undefined, preview: undefined, existingUrl: undefined } : logo
    ));
    onLogoRemove?.(type);
  };

  const handleFileChange = (type: LogoVariantType, file: File | undefined) => {
    if (!file) return;

    // Validate file before processing
    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

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

  // Separate primary variants (dark/light) from secondary slots
  const primaryVariants = logos.filter(l => l.type === "dark" || l.type === "light");
  const secondaryVariants = logos.filter(l => l.type === "icon" || l.type === "wordmark" || l.type === "alternate");

  const getVariantIcon = (type: string) => {
    switch (type) {
      case "dark": return Moon;
      case "light": return Sun;
      case "icon": return Images;
      case "wordmark": return Type;
      case "alternate": return Layers;
      default: return Image;
    }
  };

  return (
    <div className="space-y-5">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Image className="w-4 h-4" strokeWidth={1.5} />
        Logo Variants
      </Label>

      {/* Primary Variants - Side by side on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {primaryVariants.map((logo) => {
          const VariantIcon = getVariantIcon(logo.type);
          const hasUpload = logo.file || logo.existingUrl;
          const displayImage = logo.preview || logo.existingUrl;
          
          return (
            <div key={logo.type} className="space-y-2">
              {/* Label above */}
              <div className="flex items-center gap-2">
                <VariantIcon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-sm font-medium">{logo.label}</span>
                {hasUpload && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary ml-auto">
                    <Check className="w-3 h-3" strokeWidth={2} />
                    {logo.file ? "New upload" : "Saved"}
                  </span>
                )}
              </div>
              
              {/* Upload Box - Larger and more prominent */}
              <div className="relative">
                {hasUpload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 z-10 bg-background/80 hover:bg-destructive/10 hover:text-destructive rounded-full"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveLogo(logo.type); }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              <label
                className={cn(
                  "flex flex-col items-center justify-center cursor-pointer transition-all",
                  "w-full aspect-[3/2] rounded-xl border-2 border-dashed",
                  logo.type === "light" ? "bg-slate-800" : "bg-muted/50",
                  hasUpload 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/30 hover:border-primary/60",
                  "group"
                )}
              >
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={logo.label}
                    className="w-full h-full object-contain rounded-lg p-3"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      logo.type === "light" 
                        ? "bg-slate-700 group-hover:bg-slate-600" 
                        : "bg-muted group-hover:bg-muted/80"
                    )}>
                      <Upload className={cn(
                        "w-5 h-5",
                        logo.type === "light" ? "text-slate-400" : "text-muted-foreground"
                      )} strokeWidth={1.5} />
                    </div>
                    <span className={cn(
                      "text-xs text-center",
                      logo.type === "light" ? "text-slate-400" : "text-muted-foreground"
                    )}>
                      {logo.description}
                    </span>
                  </div>
                )}
                <Input
                  type="file"
                  accept=".png,.svg,.jpg,.jpeg,image/png,image/jpeg,image/svg+xml"
                  className="sr-only"
                  onChange={(e) => handleFileChange(logo.type, e.target.files?.[0])}
                />
              </label>
              </div>
              
              {/* Filename if uploaded */}
              {(logo.file || (!logo.file && logo.existingUrl && existingFilenames?.[logo.type])) && (
                <p className="text-xs text-muted-foreground truncate px-1">
                  {logo.file?.name || existingFilenames?.[logo.type]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Secondary Logo Slots - Full width below */}
      {secondaryVariants.map((variant) => {
        const VariantIcon = getVariantIcon(variant.type);
        const hasUpload = variant.file || variant.existingUrl;
        const displayImage = variant.preview || variant.existingUrl;
        
        return (
        <div key={variant.type} className="space-y-2">
          <div className="flex items-center gap-2">
            <VariantIcon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium">{variant.label}</span>
            {hasUpload && (
              <span className="inline-flex items-center gap-1 text-xs text-primary ml-auto">
                <Check className="w-3 h-3" strokeWidth={2} />
                {variant.file ? "New upload" : "Saved"}
              </span>
            )}
          </div>
          
          <div className="relative">
            {hasUpload && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 z-10 bg-background/80 hover:bg-destructive/10 hover:text-destructive rounded-full"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveLogo(variant.type); }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
            <label
              className={cn(
                "flex items-center gap-4 cursor-pointer transition-all",
                "w-full p-4 rounded-xl border-2 border-dashed",
                "bg-muted/50",
                hasUpload 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/30 hover:border-primary/60",
                "group"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                displayImage ? "bg-transparent" : "bg-muted group-hover:bg-muted/80"
              )}>
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={variant.label}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  {variant.description}
                </p>
                {(variant.file || (!variant.file && variant.existingUrl && existingFilenames?.[variant.type])) && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {variant.file?.name || existingFilenames?.[variant.type]}
                  </p>
                )}
              </div>
              
              <Input
                type="file"
                accept=".png,.svg,.jpg,.jpeg,image/png,image/jpeg,image/svg+xml"
                className="sr-only"
                onChange={(e) => handleFileChange(variant.type, e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
        );
      })}

      <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
        Accepted: PNG, SVG, JPG (max 5MB). Executables blocked.
      </p>
    </div>
  );
}
