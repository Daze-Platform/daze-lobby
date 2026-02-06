import { useState, useEffect } from "react";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorPaletteManager } from "../ColorPaletteManager";
import { MultiLogoUpload } from "../MultiLogoUpload";
import { StepCompletionEffect } from "../StepCompletionEffect";

interface BrandStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  data?: Record<string, unknown>;
  onSave: (data: { brand_palette: string[]; logos: Record<string, File> }) => void;
  onLogoUpload: (file: File, variant: string) => void;
  isSaving?: boolean;
  onStepComplete?: () => void;
  isJustCompleted?: boolean;
  isUnlocking?: boolean;
}

export function BrandStep({ 
  isCompleted, 
  isLocked, 
  data, 
  onSave, 
  onLogoUpload,
  isSaving,
  onStepComplete,
  isJustCompleted,
  isUnlocking
}: BrandStepProps) {
  const [colors, setColors] = useState<string[]>(
    (data?.brand_palette as string[]) || ["#3B82F6"]
  );
  const [logos, setLogos] = useState<Record<string, File>>({});

  // Sync with external data when it changes
  useEffect(() => {
    if (data?.brand_palette && Array.isArray(data.brand_palette)) {
      setColors(data.brand_palette as string[]);
    }
  }, [data?.brand_palette]);

  const handleLogosChange = (newLogos: Record<string, File>) => {
    setLogos(newLogos);
    // Upload each logo immediately
    Object.entries(newLogos).forEach(([variant, file]) => {
      onLogoUpload(file, variant);
    });
  };

  const handleSave = async () => {
    await onSave({ brand_palette: colors, logos });
  };

  return (
    <AccordionItem 
      value="brand" 
      className={cn(
        "px-5 relative overflow-hidden transition-all duration-300",
        isLocked && "opacity-50 pointer-events-none",
        isUnlocking && "animate-unlock-glow"
      )}
      disabled={isLocked}
    >
      <StepCompletionEffect isActive={isJustCompleted || false} />
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
            isCompleted 
              ? "bg-success text-success-foreground" 
              : "bg-muted text-muted-foreground",
            isJustCompleted && "animate-celebrate"
          )}>
            {isCompleted ? <Check className="w-4 h-4" /> : "B"}
          </div>
          <div className="text-left">
            <p className="font-medium">Brand Identity</p>
            <p className="text-sm text-muted-foreground">Upload logos and define your color palette</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-6 pt-2">
          {/* Multi Logo Upload */}
          <MultiLogoUpload onLogosChange={handleLogosChange} />

          {/* Color Palette Manager */}
          <ColorPaletteManager 
            colors={colors} 
            onChange={setColors} 
            maxColors={5}
          />

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview: Mock Daze Order Screen</Label>
            <div 
              className="border rounded-lg p-4 bg-background"
              style={{ borderColor: colors[0] || "#3B82F6" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: colors[0] || "#3B82F6" }}
                >
                  D
                </div>
                <span className="font-semibold">Your Hotel Name</span>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <Button 
                className="mt-4 w-full text-white"
                style={{ 
                  backgroundColor: colors[0] || "#3B82F6",
                }}
              >
                Place Order
              </Button>
              {colors.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {colors.slice(1).map((color, i) => (
                    <div
                      key={i}
                      className="h-2 flex-1 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <SaveButton 
            onClick={handleSave}
            onSuccess={onStepComplete}
            className="w-full"
            idleText="Save Brand Settings"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
