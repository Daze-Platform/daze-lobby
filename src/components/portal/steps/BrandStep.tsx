import { useState, useEffect } from "react";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { SaveButton } from "@/components/ui/save-button";
import { cn } from "@/lib/utils";
import { PropertyBrandManager, type PropertyBrand } from "../PropertyBrandManager";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { StepBadge, type StepBadgeStatus } from "@/components/ui/step-badge";
import { useLogActivity } from "@/hooks/useLogActivity";
import { useClient } from "@/contexts/ClientContext";

interface BrandStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  isActive?: boolean;
  data?: Record<string, unknown>;
  onSave: (data: { properties: PropertyBrand[] }) => void;
  onLogoUpload: (propertyId: string, file: File, variant: string) => void;
  onDocumentUpload?: (propertyId: string, file: File) => void;
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
  onDocumentUpload,
  isSaving,
  onStepComplete,
  isJustCompleted,
  isUnlocking,
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

  // Helper to extract palette document URL for a property from task data
  const getPaletteDocumentUrl = (propertyId: string, taskData?: Record<string, unknown>): string | null => {
    if (!taskData) return null;
    const fieldKey = `palette_document_${propertyId}`;
    const filePath = taskData[fieldKey] as string | undefined;
    if (!filePath) return null;
    // The file path is stored, we need to construct the public URL
    // Files are stored in onboarding-assets bucket
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/onboarding-assets/${filePath}`;
  };

  // Helper to extract logo URLs for a property from task data
  const getLogoUrls = (propertyId: string, taskData?: Record<string, unknown>): Record<string, string> => {
    if (!taskData) return {};
    const result: Record<string, string> = {};

    // Primary: look at top-level keys like "logo_{propertyId}_{variant}" (stored by uploadFileMutation)
    const propertyPrefix = `logo_${propertyId}_`;
    for (const [key, value] of Object.entries(taskData)) {
      if (key.startsWith(propertyPrefix) && typeof value === "string") {
        const variant = key.substring(propertyPrefix.length);
        result[variant] = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/onboarding-assets/${value}`;
      }
    }

    // Fallback: legacy data.logos format (full URLs)
    const logos = (taskData.logos || {}) as Record<string, string>;
    for (const [key, url] of Object.entries(logos)) {
      const legacyPrefix = `logo_${propertyId}_`;
      if (key.startsWith(legacyPrefix)) {
        const variant = key.substring(legacyPrefix.length);
        if (!result[variant]) result[variant] = url;
      } else if (!key.startsWith("logo_") && ["dark", "light", "icon"].includes(key)) {
        if (!result[key]) result[key] = url;
      }
    }

    return result;
  };

  // Initialize properties from saved data or empty
  const [properties, setProperties] = useState<PropertyBrand[]>(() => {
    const savedProperties = data?.properties as PropertyBrand[] | undefined;
    if (savedProperties && Array.isArray(savedProperties) && savedProperties.length > 0) {
      // Hydrate with palette document URLs and logo URLs from task data
      return savedProperties.map(prop => {
        const extractedLogoUrls = getLogoUrls(prop.id, data);
        return {
          ...prop,
          logoUrls: { ...(prop.logoUrls || {}), ...extractedLogoUrls },
          paletteDocumentUrl: prop.paletteDocumentUrl || getPaletteDocumentUrl(prop.id, data),
        };
      });
    }
    // Legacy support: convert old format
    const legacyColors = data?.brand_palette as string[] | undefined;
    const legacyLogos = data?.logos as Record<string, string> | undefined;
    if (legacyColors || legacyLogos) {
      return [{
        id: "property-default",
        name: "Main Property",
        logos: {},
        logoUrls: legacyLogos,
        colors: legacyColors || ["#3B82F6"],
        paletteDocumentUrl: getPaletteDocumentUrl("property-default", data),
        isExpanded: true,
      }];
    }
    return [];
  });

  // Sync with external data when it changes
  useEffect(() => {
    const savedProperties = data?.properties as PropertyBrand[] | undefined;
    if (savedProperties && Array.isArray(savedProperties)) {
      // Hydrate with palette document URLs and logo URLs from task data
      setProperties(savedProperties.map(prop => {
        const extractedLogoUrls = getLogoUrls(prop.id, data);
        return {
          ...prop,
          logoUrls: { ...(prop.logoUrls || {}), ...extractedLogoUrls },
          paletteDocumentUrl: prop.paletteDocumentUrl || getPaletteDocumentUrl(prop.id, data),
        };
      }));
    }
  }, [data?.properties, data]);

  const handlePropertiesChange = (updated: PropertyBrand[]) => {
    setProperties(updated);
  };

  const handleLogoUpload = (propertyId: string, file: File, variant: string) => {
    onLogoUpload(propertyId, file, variant);
  };

  const handleDocumentUpload = (propertyId: string, file: File) => {
    if (onDocumentUpload) {
      onDocumentUpload(propertyId, file);
    }
  };

  const handleSave = async () => {
    await onSave({ properties });
    
    // Log activity
    logActivity.mutate({
      action: "brand_updated",
      details: {
        property_count: properties.length,
        properties: properties.map(p => ({
          name: p.name,
          color_count: p.colors.length,
          has_logos: Object.keys(p.logos).length > 0,
        })),
      },
    });
  };

  const hasAtLeastOneProperty = properties.length > 0;
  const allPropertiesHaveBranding = properties.every(p => 
    (Object.keys(p.logos).length > 0 || Object.keys(p.logoUrls || {}).length > 0) || 
    p.colors.length > 0
  );

  return (
    <AccordionItem 
      value="brand" 
      className={cn(
        "px-3 sm:px-5 relative overflow-hidden transition-all duration-300 border-0",
        isLocked && "opacity-50 pointer-events-none",
        isUnlocking && "animate-unlock-glow"
      )}
      disabled={isLocked}
    >
      <StepCompletionEffect isActive={isJustCompleted || false} />
      <AccordionTrigger className="hover:no-underline py-2.5 md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          <StepBadge 
            step="B" 
            status={badgeStatus} 
            isJustCompleted={isJustCompleted} 
          />
          <div className="text-left min-w-0">
            <p className="font-semibold text-xs sm:text-sm md:text-base truncate">Brand Identity</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">
              Add properties and configure branding for each
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3 sm:pb-4">
        <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
          <PropertyBrandManager
            properties={properties}
            onChange={handlePropertiesChange}
            onLogoUpload={handleLogoUpload}
            onDocumentUpload={handleDocumentUpload}
          />

          <SaveButton 
            onClick={handleSave}
            onSuccess={onStepComplete}
            className="w-full min-h-[44px]"
            idleText={hasAtLeastOneProperty ? "Save Brand Settings" : "Add a property first"}
            disabled={!hasAtLeastOneProperty}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
