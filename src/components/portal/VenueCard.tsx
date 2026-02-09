import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Upload, FileText, X, Check, Loader2, AlertCircle, Store, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateMenuFile, validateImageFile } from "@/lib/fileValidation";
import { toast } from "sonner";
import { IconStack } from "@/components/ui/icon-container";

// Re-export Venue type from centralized types for backwards compatibility
export type { Venue } from "@/types/venue";
import type { Venue } from "@/types/venue";

interface VenueCardProps {
  venue: Venue;
  onNameChange: (name: string) => void;
  onMenuUpload: (file: File) => void;
  onLogoUpload: (file: File) => void;
  onRemove: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  isUploading?: boolean;
  isUploadingLogo?: boolean;
  autoFocus?: boolean;
}

export function VenueCard({ 
  venue, 
  onNameChange, 
  onMenuUpload,
  onLogoUpload, 
  onRemove, 
  isSaving,
  isDeleting,
  isUploading,
  isUploadingLogo,
  autoFocus,
}: VenueCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localName, setLocalName] = useState(venue.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Sync local name when venue changes from server
  useEffect(() => {
    setLocalName(venue.name);
  }, [venue.name]);
  
  // Auto-focus when newly added
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleMenuFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file before processing
    const validation = validateMenuFile(file, 20);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = ''; // Reset input
      return;
    }

    onMenuUpload(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file before processing
    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = ''; // Reset input
      return;
    }

    onLogoUpload(file);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLocalName(newName);
    onNameChange(newName);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onRemove();
  };

  const hasMenu = venue.menuFile || venue.menuPdfUrl;
  const hasLogo = venue.logoFile || venue.logoUrl;

  return (
    <Card className="relative group">
      {/* Delete Button with Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" strokeWidth={1.5} />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{venue.name || "this venue"}" and its files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardContent className="p-4 space-y-4">
        {/* Venue Name - with save indicator */}
        <div className="space-y-2">
          <Label 
            htmlFor={`venue-name-${venue.id}`}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Store className="w-4 h-4" strokeWidth={1.5} />
            Venue Name
            <span className="text-destructive">*</span>
            {isSaving && (
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
          </Label>
          <Input
            ref={inputRef}
            id={`venue-name-${venue.id}`}
            value={localName}
            onChange={handleNameChange}
            placeholder="e.g., Pool Deck, Lobby Bar, Room Service"
            className="font-medium"
            maxLength={100}
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            <Image className="w-3.5 h-3.5" strokeWidth={1.5} />
            Venue Logo
          </Label>

          <label
            className={cn(
              "flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-all",
              hasLogo 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
            )}
          >
            {isUploadingLogo ? (
              <div className="flex items-center gap-2 w-full justify-center py-2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" strokeWidth={1.5} />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </div>
            ) : hasLogo ? (
              <>
                <div className="w-12 h-12 rounded-lg bg-white border border-border overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={venue.logoUrl || (venue.logoFile ? URL.createObjectURL(venue.logoFile) : undefined)}
                    alt={`${venue.name} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Check className="w-4 h-4 text-primary" strokeWidth={2} />
                    Logo uploaded
                  </span>
                  <span className="text-xs text-muted-foreground">Click to replace</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground">Upload venue logo</span>
                  <span className="text-xs text-muted-foreground block">PNG, JPG, SVG (max 5MB)</span>
                </div>
              </div>
            )}
            <Input
              type="file"
              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
              className="sr-only"
              onChange={handleLogoFileChange}
            />
          </label>
        </div>

        {/* Menu Upload */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            Menu (PDF)
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
              onChange={handleMenuFileChange}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
