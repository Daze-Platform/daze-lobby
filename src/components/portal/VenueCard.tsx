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
import { Upload, FileText, X, Check, Loader2, AlertCircle, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateMenuFile } from "@/lib/fileValidation";
import { toast } from "sonner";
import { IconStack } from "@/components/ui/icon-container";

export interface Venue {
  id: string;
  name: string;
  menuFile?: File;
  menuFileName?: string;
  menuPdfUrl?: string;
}

interface VenueCardProps {
  venue: Venue;
  onNameChange: (name: string) => void;
  onMenuUpload: (file: File) => void;
  onRemove: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  isUploading?: boolean;
  autoFocus?: boolean;
}

export function VenueCard({ 
  venue, 
  onNameChange, 
  onMenuUpload, 
  onRemove, 
  isSaving,
  isDeleting,
  isUploading,
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

    onMenuUpload(file);
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
              This will permanently remove "{venue.name || "this venue"}" and its menu. This action cannot be undone.
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
