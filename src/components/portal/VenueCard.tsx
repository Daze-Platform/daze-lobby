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
import { Upload, FileText, X, Check, Loader2, AlertCircle, Store, Image, Plus } from "lucide-react";
import { ColorPaletteManager } from "./ColorPaletteManager";
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
  onAdditionalLogoUpload: (file: File) => void;
  onRemove: () => void;
  onMenuRemove?: (menuId: string) => void;
  onLogoRemove?: () => void;
  onAdditionalLogoRemove?: () => void;
  onColorPaletteChange?: (colors: string[]) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  isUploading?: boolean;
  isUploadingLogo?: boolean;
  isUploadingAdditionalLogo?: boolean;
  autoFocus?: boolean;
}

export function VenueCard({ 
  venue, 
  onNameChange, 
  onMenuUpload,
  onLogoUpload,
  onAdditionalLogoUpload, 
  onRemove,
  onMenuRemove,
  onLogoRemove,
  onAdditionalLogoRemove,
  onColorPaletteChange,
  isSaving,
  isDeleting,
  isUploading,
  isUploadingLogo,
  isUploadingAdditionalLogo,
  autoFocus,
}: VenueCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);
  const [localName, setLocalName] = useState(venue.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Sync local name when venue changes from server, but only if not actively typing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalName(venue.name);
    }
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

    const validation = validateMenuFile(file, 20);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = '';
      return;
    }

    onMenuUpload(file);
    e.target.value = ''; // Reset so same file can be uploaded again
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = '';
      return;
    }

    onLogoUpload(file);
  };

  const handleAdditionalLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = '';
      return;
    }

    onAdditionalLogoUpload(file);
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

  const hasLogo = venue.logoFile || venue.logoUrl;
  const hasAdditionalLogo = !!venue.additionalLogoUrl;
  const hasMenus = venue.menus.length > 0;

  return (
    <Card className="relative group">
      {/* Delete Button with Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
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
            onFocus={() => { isFocusedRef.current = true; }}
            onBlur={() => {
              isFocusedRef.current = false;
              setLocalName(venue.name);
            }}
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
            <span className="text-destructive">*</span>
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
                  <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                    {venue.logoFile?.name || venue.logoFileName || "Click to replace"}
                  </span>
                </div>
                {onLogoRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLogoRemove(); }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
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

        {/* Additional Logo Upload */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            <Image className="w-3.5 h-3.5" strokeWidth={1.5} />
            Additional Logo
          </Label>

          <label
            className={cn(
              "flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-all",
              hasAdditionalLogo 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
            )}
          >
            {isUploadingAdditionalLogo ? (
              <div className="flex items-center gap-2 w-full justify-center py-2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" strokeWidth={1.5} />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </div>
            ) : hasAdditionalLogo ? (
              <>
                <div className="w-12 h-12 rounded-lg bg-white border border-border overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={venue.additionalLogoUrl}
                    alt={`${venue.name} additional logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Check className="w-4 h-4 text-primary" strokeWidth={2} />
                    Additional logo uploaded
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                    {venue.additionalLogoFileName || "Click to replace"}
                  </span>
                </div>
                {onAdditionalLogoRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdditionalLogoRemove(); }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground">Upload additional logo</span>
                  <span className="text-xs text-muted-foreground block">PNG, JPG, SVG (max 5MB)</span>
                </div>
              </div>
            )}
            <Input
              type="file"
              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
              className="sr-only"
              onChange={handleAdditionalLogoFileChange}
            />
          </label>
        </div>

        {/* Menus Section - Multiple Upload */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            Menus (PDF)
            <span className="text-destructive">*</span>
            {hasMenus && (
              <span className="ml-auto text-xs text-muted-foreground">
                {venue.menus.length} menu{venue.menus.length !== 1 ? "s" : ""}
              </span>
            )}
          </Label>

          {/* Existing Menus List */}
          {venue.menus.map((menu) => (
            <div
              key={menu.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-primary/5"
            >
              <div className="flex items-center gap-2 text-primary shrink-0">
                <FileText className="w-4 h-4" strokeWidth={1.5} />
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{menu.fileName || "Menu"}</p>
                {menu.label && (
                  <p className="text-xs text-muted-foreground truncate">{menu.label}</p>
                )}
              </div>
              {onMenuRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onMenuRemove(menu.id)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}

          {/* Upload New Menu */}
          <label
            className={cn(
              "flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-lg cursor-pointer transition-all",
              "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" strokeWidth={1.5} />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <IconStack backgroundIcon={FileText} foregroundIcon={hasMenus ? Plus : Upload} />
                <span className="text-sm text-muted-foreground mt-2">
                  {hasMenus ? "Add another menu" : "Drop menu PDF or click to upload"}
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

        {/* Color Palette */}
        {onColorPaletteChange && (
          <ColorPaletteManager
            colors={venue.colorPalette || []}
            onChange={onColorPaletteChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
