import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X, Check, Loader2, AlertCircle, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateMenuFile } from "@/lib/fileValidation";
import { toast } from "sonner";
import { IconContainer, IconStack } from "@/components/ui/icon-container";

export interface Venue {
  id: string;
  name: string;
  menuFile?: File;
  menuFileName?: string;
  menuPdfUrl?: string;
}

interface VenueCardProps {
  venue: Venue;
  onUpdate: (venue: Venue) => void;
  onRemove: (id: string) => void;
  isUploading?: boolean;
}

export function VenueCard({ venue, onUpdate, onRemove, isUploading }: VenueCardProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file before processing
    const validation = validateMenuFile(file, 20);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = ''; // Reset input
      return;
    }

    onUpdate({
      ...venue,
      menuFile: file,
      menuFileName: file.name,
    });
  };

  const hasMenu = venue.menuFile || venue.menuPdfUrl;
  const hasName = venue.name.trim().length > 0;

  return (
    <Card className="relative group">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={() => onRemove(venue.id)}
      >
        <X className="w-4 h-4" strokeWidth={1.5} />
      </Button>

      <CardContent className="p-4 space-y-4">
        {/* Venue Name - Now prominent with label */}
        <div className="space-y-2">
          <Label 
            htmlFor={`venue-name-${venue.id}`}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Store className="w-4 h-4" strokeWidth={1.5} />
            Venue Name
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`venue-name-${venue.id}`}
            value={venue.name}
            onChange={(e) => onUpdate({ ...venue, name: e.target.value })}
            placeholder="e.g., Pool Deck, Lobby Bar, Room Service"
            className="font-medium"
            maxLength={100}
          />
        </div>

        {/* Menu Upload */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Menu (PDF only)
          </Label>

          <label
            className={cn(
              "flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-lg cursor-pointer transition-all",
              hasMenu 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" strokeWidth={1.5} />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : hasMenu ? (
              <>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <FileText className="w-5 h-5" strokeWidth={1.5} />
                  <Check className="w-4 h-4" strokeWidth={2} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {venue.menuFileName || "Menu uploaded"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Click to replace
                </span>
              </>
            ) : (
              <>
                <IconStack backgroundIcon={FileText} foregroundIcon={Upload} />
                <span className="text-sm text-muted-foreground mt-2">
                  Drop menu PDF or click to upload
                </span>
                <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
                  PDF only, max 20MB
                </span>
              </>
            )}
            <Input
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
