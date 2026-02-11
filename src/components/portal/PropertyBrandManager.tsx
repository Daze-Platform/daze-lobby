import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Building2, 
  ChevronDown, 
  ChevronUp,
  Check,
  Image,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiLogoUpload } from "./MultiLogoUpload";
import { ColorPaletteManager } from "./ColorPaletteManager";
import { BrandDocumentUpload } from "./BrandDocumentUpload";
import { OrDivider } from "@/components/ui/or-divider";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface PropertyBrand {
  id: string;
  name: string;
  logos: Record<string, File>;
  logoUrls?: Record<string, string>;
  logoFilenames?: Record<string, string>;
  colors: string[];
  paletteDocumentUrl?: string | null;
  paletteDocumentFilename?: string | null;
  isExpanded?: boolean;
}

interface PropertyBrandManagerProps {
  properties: PropertyBrand[];
  onChange: (properties: PropertyBrand[]) => void;
  onLogoUpload: (propertyId: string, file: File, variant: string) => void;
  onDocumentUpload?: (propertyId: string, file: File) => void;
}

export function PropertyBrandManager({
  properties,
  onChange,
  onLogoUpload,
  onDocumentUpload,
}: PropertyBrandManagerProps) {
  const [localProperties, setLocalProperties] = useState<PropertyBrand[]>(properties);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newPropertyName, setNewPropertyName] = useState("");
  const isEditingRef = useRef(false);

  // Sync with external properties only when not actively editing
  useEffect(() => {
    if (!isEditingRef.current) {
      setLocalProperties(properties);
    }
  }, [properties]);

  const addProperty = () => {
    if (!newPropertyName.trim()) return;

    const newProperty: PropertyBrand = {
      id: `property-${Date.now()}`,
      name: newPropertyName.trim(),
      logos: {},
      colors: ["#3B82F6"],
      isExpanded: true,
    };

    const updated = [...localProperties, newProperty];
    // Collapse other properties when adding new one
    const withCollapsed = updated.map((p, idx) => ({
      ...p,
      isExpanded: idx === updated.length - 1,
    }));
    
    setLocalProperties(withCollapsed);
    onChange(withCollapsed);
    setNewPropertyName("");
  };

  const updateProperty = (id: string, updates: Partial<PropertyBrand>) => {
    const updated = localProperties.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    setLocalProperties(updated);
    onChange(updated);
  };

  const deleteProperty = (id: string) => {
    const prop = localProperties.find(p => p.id === id);
    const updated = localProperties.filter((p) => p.id !== id);
    setLocalProperties(updated);
    onChange(updated);
    setDeleteTarget(null);
    toast.success(`"${prop?.name || "Property"}" removed`);
  };

  const toggleExpanded = (id: string) => {
    const updated = localProperties.map((p) =>
      p.id === id ? { ...p, isExpanded: !p.isExpanded } : p
    );
    setLocalProperties(updated);
    onChange(updated);
  };

  const handleLogosChange = (propertyId: string, logos: Record<string, File>) => {
    updateProperty(propertyId, { logos });
    Object.entries(logos).forEach(([variant, file]) => {
      onLogoUpload(propertyId, file, variant);
    });
  };

  const handleColorsChange = (propertyId: string, colors: string[]) => {
    updateProperty(propertyId, { colors });
  };

  const handleDocumentUpload = (propertyId: string, file: File) => {
    if (onDocumentUpload) {
      onDocumentUpload(propertyId, file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addProperty();
    }
  };

  const getPropertyStatus = (property: PropertyBrand) => {
    const hasLogo = Object.keys(property.logos).length > 0 || 
                    Object.keys(property.logoUrls || {}).length > 0;
    const hasColors = property.colors.length > 0;
    return { hasLogo, hasColors, isComplete: hasLogo || hasColors };
  };

  return (
    <div className="space-y-4">
      {/* Add Property Input */}
      <div className="space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Properties
        </p>
        <p className="text-xs text-muted-foreground">
          Add each property name, then configure branding for each
        </p>
        <div className="flex gap-2">
          <Input
            value={newPropertyName}
            onChange={(e) => setNewPropertyName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter property name (e.g., The Grand Hotel)"
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={addProperty}
            disabled={!newPropertyName.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Properties List */}
      {localProperties.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {localProperties.map((property) => {
            const status = getPropertyStatus(property);
            
            return (
              <motion.div
                key={property.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              >
              <Card 
                className={cn(
                  "border-border/50 overflow-hidden transition-all",
                  property.isExpanded && "ring-1 ring-primary/20"
                )}
              >
                <Collapsible
                  open={property.isExpanded}
                  onOpenChange={() => toggleExpanded(property.id)}
                >
                  {/* Property Header */}
                  <div className="flex items-center gap-3 p-3 sm:p-4">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          status.isComplete 
                            ? "bg-emerald-500/10 text-emerald-600" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {status.isComplete ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Building2 className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {property.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {status.hasLogo && (
                              <span className="text-2xs text-muted-foreground flex items-center gap-1">
                                <Image className="h-3 w-3" />
                                Logo
                              </span>
                            )}
                            {status.hasColors && (
                              <span className="text-2xs text-muted-foreground flex items-center gap-1">
                                <Palette className="h-3 w-3" />
                                {property.colors.length} color{property.colors.length !== 1 ? "s" : ""}
                              </span>
                            )}
                            {!status.isComplete && (
                              <span className="text-2xs text-amber-600">
                                Needs branding
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-muted-foreground">
                          {property.isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(property.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Expanded Content */}
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 px-3 sm:px-4 space-y-5 border-t border-border/50">
                      {/* Property Name Edit */}
                      <div className="pt-4 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Property Name
                        </label>
                        <Input
                          value={property.name}
                          onChange={(e) => updateProperty(property.id, { name: e.target.value })}
                          onFocus={() => { isEditingRef.current = true; }}
                          onBlur={() => { isEditingRef.current = false; }}
                          placeholder="Property name"
                          className="h-9"
                        />
                      </div>

                      {/* Logo Upload */}
                      <MultiLogoUpload
                        onLogosChange={(logos) => handleLogosChange(property.id, logos)}
                        existingUrls={property.logoUrls}
                        existingFilenames={property.logoFilenames}
                      />

                      {/* Brand Colors */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Brand Colors</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload brand guidelines or define colors manually
                          </p>
                        </div>

                      <BrandDocumentUpload
                          onUpload={(file) => handleDocumentUpload(property.id, file)}
                          existingUrl={property.paletteDocumentUrl}
                          existingFilename={property.paletteDocumentFilename}
                          label="Upload Brand Guidelines"
                          description="PDF, PNG, or image with your official color palette"
                        />

                        <OrDivider />

                        <ColorPaletteManager
                          colors={property.colors}
                          onChange={(colors) => handleColorsChange(property.id, colors)}
                          maxColors={5}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-8 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No properties added yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enter a property name above to get started
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {localProperties.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {localProperties.length} propert{localProperties.length !== 1 ? "ies" : "y"} configured
        </p>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the property and all its branding configurations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteProperty(deleteTarget)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
