import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Upload, FileText, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    if (file) {
      onUpdate({
        ...venue,
        menuFile: file,
        menuFileName: file.name,
      });
    }
  };

  const hasMenu = venue.menuFile || venue.menuPdfUrl;

  return (
    <Card className="relative group">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(venue.id)}
      >
        <X className="w-4 h-4" />
      </Button>

      <CardHeader className="pb-3">
        <Input
          value={venue.name}
          onChange={(e) => onUpdate({ ...venue, name: e.target.value })}
          placeholder="Venue name..."
          className="font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
        />
      </CardHeader>

      <CardContent className="pt-0">
        <Label className="text-sm text-muted-foreground mb-3 block">
          Menu PDF
        </Label>

        <label
          className={cn(
            "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all",
            hasMenu 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : hasMenu ? (
            <>
              <div className="flex items-center gap-2 text-primary mb-1">
                <FileText className="w-6 h-6" />
                <Check className="w-4 h-4" />
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
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Drop menu PDF or click to upload
              </span>
            </>
          )}
          <Input
            type="file"
            accept=".pdf"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      </CardContent>
    </Card>
  );
}
