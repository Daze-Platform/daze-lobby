import { useState, useEffect } from "react";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { SaveButton } from "@/components/ui/save-button";
import { cn } from "@/lib/utils";
import { ColorPaletteManager } from "../ColorPaletteManager";
import { MultiLogoUpload } from "../MultiLogoUpload";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { StepBadge, type StepBadgeStatus } from "@/components/ui/step-badge";
import { useLogActivity } from "@/hooks/useLogActivity";
import { useClient } from "@/contexts/ClientContext";

interface BrandStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  isActive?: boolean;
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
  isActive = false,
  data, 
  onSave, 
  onLogoUpload,
  isSaving,
  onStepComplete,
  isJustCompleted,
  isUnlocking
}: BrandStepProps) {
  const { clientId } = useClient();
  const logActivity = useLogActivity(clientId);

  // Derive badge status
  const badgeStatus: StepBadgeStatus = isCompleted 
    ? "complete" 
    : isLocked 
      ? "locked" 
      : isActive 
        ? "active" 
        : "pending";
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
    
    // Log activity
    logActivity.mutate({
      action: "brand_updated",
      details: {
        color_count: colors.length,
      },
    });
  };

  return (
    <AccordionItem 
      value="brand" 
      className={cn(
        "px-5 relative overflow-hidden transition-all duration-300 border-0",
        isLocked && "opacity-50 pointer-events-none",
        isUnlocking && "animate-unlock-glow"
      )}
      disabled={isLocked}
    >
      <StepCompletionEffect isActive={isJustCompleted || false} />
      <AccordionTrigger className="hover:no-underline py-3 md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          <StepBadge 
            step="B" 
            status={badgeStatus} 
            isJustCompleted={isJustCompleted} 
          />
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm md:text-base truncate">Brand Identity</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">Upload logos and define your color palette</p>
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

          <SaveButton 
            onClick={handleSave}
            onSuccess={onStepComplete}
            className="w-full min-h-[44px]"
            idleText="Save Brand Settings"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
