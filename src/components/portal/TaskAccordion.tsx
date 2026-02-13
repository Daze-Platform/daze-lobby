import { useState, useCallback } from "react";
import { Accordion } from "@/components/ui/accordion";
import { LegalStep, BrandStep, VenueStep, PosStep, DevicesStep } from "./steps";
import { VenueProvider } from "@/contexts/VenueContext";
import type { Venue } from "@/types/venue";
import type { PropertyBrand } from "./PropertyBrandManager";
import type { PilotAgreementData } from "@/types/pilotAgreement";

interface OnboardingTask {
  key: string;
  name: string;
  isCompleted: boolean;
  data?: Record<string, unknown>;
}

interface TaskAccordionProps {
  tasks: OnboardingTask[];
  onLegalSign: (signatureDataUrl: string, data: PilotAgreementData) => void;
  onTaskUpdate: (taskKey: string, data: Record<string, unknown>, markCompleted?: boolean) => void;
  onFileUpload: (taskKey: string, file: File, fieldName: string) => void;
  onSaveLegalDraft?: (data: Record<string, unknown>) => Promise<void>;
  onRemoveTaskKeys?: (args: { taskKey: string; mergeData: Record<string, unknown>; removeKeys: string[] }) => Promise<void>;
  // Venue CRUD handlers (passed to VenueProvider)
  venues: Venue[];
  onAddVenue: () => Promise<Venue | undefined>;
  onUpdateVenue: (id: string, updates: { name?: string; menuPdfUrl?: string | null; logoUrl?: string | null }) => Promise<void>;
  onRemoveVenue: (id: string) => Promise<void>;
  onUploadMenu: (venueId: string, venueName: string, file: File) => Promise<void>;
  onUploadVenueLogo: (venueId: string, venueName: string, file: File) => Promise<void>;
  onUploadVenueAdditionalLogo: (venueId: string, venueName: string, file: File) => Promise<void>;
  onCompleteVenueStep: () => Promise<void>;
  onDeleteVenueMenu: (menuId: string) => Promise<void>;
  isAddingVenue?: boolean;
  isUpdatingVenue?: boolean;
  isDeletingVenue?: boolean;
  isSigningLegal?: boolean;
  isUpdating?: boolean;
  hotelLegalEntity?: PilotAgreementData;
}

const TASK_ORDER = ["brand", "venue", "pos", "devices", "legal"];

export function TaskAccordion({ 
  tasks, 
  onLegalSign,
  onTaskUpdate, 
  onFileUpload,
  venues,
  onAddVenue,
  onUpdateVenue,
  onRemoveVenue,
  onUploadMenu,
  onUploadVenueLogo,
  onUploadVenueAdditionalLogo,
  onCompleteVenueStep,
  onDeleteVenueMenu,
  isAddingVenue,
  isUpdatingVenue,
  isDeletingVenue,
  isSigningLegal,
  isUpdating,
  hotelLegalEntity,
  onSaveLegalDraft,
  onRemoveTaskKeys
}: TaskAccordionProps) {
  const [accordionValue, setAccordionValue] = useState<string | undefined>();
  const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null);
  const [unlockingStep, setUnlockingStep] = useState<string | null>(null);

  const getTaskData = (key: string) => tasks.find(t => t.key === key);
  
  const isTaskLocked = (key: string) => {
    const taskIndex = TASK_ORDER.indexOf(key);
    if (taskIndex <= 0) return false;
    
    const prevTaskKey = TASK_ORDER[taskIndex - 1];
    const prevTask = tasks.find(t => t.key === prevTaskKey);
    return prevTask ? !prevTask.isCompleted : false;
  };

  const getNextStep = (currentKey: string): string | null => {
    const currentIndex = TASK_ORDER.indexOf(currentKey);
    if (currentIndex === -1 || currentIndex >= TASK_ORDER.length - 1) return null;
    return TASK_ORDER[currentIndex + 1];
  };

  const handleStepComplete = useCallback((stepKey: string) => {
    setRecentlyCompleted(stepKey);
    
    // Faster timeline for snappy UX
    // 0ms: Celebration badge animation
    // 200ms: Collapse current step
    // 400ms: Open next step with glow
    // 1000ms: Clear all states
    
    setTimeout(() => {
      setAccordionValue(undefined);
    }, 200);
    
    setTimeout(() => {
      const nextStep = getNextStep(stepKey);
      if (nextStep) {
        setUnlockingStep(nextStep);
        setAccordionValue(nextStep);
      }
    }, 400);
    
    setTimeout(() => {
      setRecentlyCompleted(null);
      setUnlockingStep(null);
    }, 1000);
  }, []);

  const handleBrandSave = async (data: { properties: PropertyBrand[] }) => {
    // Strip File objects (non-serializable) before saving to DB
    const cleanProperties = data.properties.map(p => ({
      ...p,
      logos: {},  // File objects can't be serialized; URLs are stored separately via uploadLogoMutation
    }));
    onTaskUpdate("brand", { properties: cleanProperties }, true);
  };

  const handleLogoUpload = (propertyId: string, file: File, variant: string) => {
    onFileUpload("brand", file, `logo_${propertyId}_${variant}`);
  };

  const handleBrandDocumentUpload = (propertyId: string, file: File, slotIndex: number) => {
    const fieldName = slotIndex === 0 ? `palette_document_${propertyId}` : `palette_document_${propertyId}_${slotIndex}`;
    onFileUpload("brand", file, fieldName);
  };

  const handleLogoRemove = async (propertyId: string, variant: string) => {
    if (!onRemoveTaskKeys) return;
    
    // Read current logos/logoFilenames to rebuild without the removed variant
    const brandTask = tasks.find(t => t.key === "brand");
    const existingData = (brandTask?.data || {}) as Record<string, unknown>;
    const logos = { ...((existingData.logos || {}) as Record<string, string>) };
    const logoFilenames = { ...((existingData.logoFilenames || {}) as Record<string, string>) };
    
    // Remove from logos map
    delete logos[variant];
    delete logos[`logo_${propertyId}_${variant}`];
    delete logoFilenames[variant];
    delete logoFilenames[`logo_${propertyId}_${variant}`];
    
    const topLevelKey = `logo_${propertyId}_${variant}`;
    
    await onRemoveTaskKeys({
      taskKey: "brand",
      mergeData: { logos, logoFilenames },
      removeKeys: [topLevelKey, `${topLevelKey}_filename`],
    });
  };

  const handleDocumentRemove = async (propertyId: string, slotIndex: number) => {
    if (!onRemoveTaskKeys) return;
    
    const fieldKey = slotIndex === 0 ? `palette_document_${propertyId}` : `palette_document_${propertyId}_${slotIndex}`;
    
    await onRemoveTaskKeys({
      taskKey: "brand",
      mergeData: {},
      removeKeys: [fieldKey, `${fieldKey}_filename`],
    });
  };

  const handleLegalSign = (signatureDataUrl: string, legalEntityData: PilotAgreementData) => {
    onLegalSign(signatureDataUrl, legalEntityData);
    // Trigger step completion after a brief delay for the save to process
    setTimeout(() => handleStepComplete("legal"), 100);
  };

  const handleBrandComplete = () => {
    handleStepComplete("brand");
  };

  const handleVenueComplete = () => {
    handleStepComplete("venue");
  };

  const handlePosUpdate = (data: { provider: string; status: string; pms_name?: string }, markCompleted?: boolean) => {
    onTaskUpdate("pos", data, markCompleted);
  };

  const handlePosComplete = () => {
    handleStepComplete("pos");
  };

  const handleDevicesUpdate = (data: { use_daze_tablets: boolean; tablet_count?: number }) => {
    onTaskUpdate("devices", data, true);
  };

  const handleDevicesComplete = () => {
    handleStepComplete("devices");
  };

  return (
    <VenueProvider
      venues={venues}
      onAddVenue={onAddVenue}
      onUpdateVenue={onUpdateVenue}
      onRemoveVenue={onRemoveVenue}
      onUploadMenu={onUploadMenu}
      onUploadLogo={onUploadVenueLogo}
      onUploadAdditionalLogo={onUploadVenueAdditionalLogo}
      onCompleteStep={onCompleteVenueStep}
      onDeleteMenu={onDeleteVenueMenu}
      isAddingVenue={isAddingVenue}
      isUpdatingVenue={isUpdatingVenue}
      isDeletingVenue={isDeletingVenue}
    >
      <Accordion 
        type="single" 
        collapsible 
        className="w-full space-y-2 sm:space-y-4"
        value={accordionValue}
        onValueChange={setAccordionValue}
      >
        <BrandStep
          isCompleted={getTaskData("brand")?.isCompleted || false}
          isLocked={isTaskLocked("brand")}
          data={getTaskData("brand")?.data}
          onSave={handleBrandSave}
          onLogoUpload={handleLogoUpload}
          onLogoRemove={handleLogoRemove}
          onDocumentUpload={handleBrandDocumentUpload}
          onDocumentRemove={handleDocumentRemove}
          isSaving={isUpdating}
          onStepComplete={handleBrandComplete}
          isJustCompleted={recentlyCompleted === "brand"}
          isUnlocking={unlockingStep === "brand"}
        />
        
        <VenueStep
          isCompleted={getTaskData("venue")?.isCompleted || false}
          isLocked={isTaskLocked("venue")}
          onStepComplete={handleVenueComplete}
          isJustCompleted={recentlyCompleted === "venue"}
          isUnlocking={unlockingStep === "venue"}
        />
        
        <PosStep
          isCompleted={getTaskData("pos")?.isCompleted || false}
          isLocked={isTaskLocked("pos")}
          data={getTaskData("pos")?.data}
          onUpdate={handlePosUpdate}
          isSaving={isUpdating}
          onStepComplete={handlePosComplete}
          isJustCompleted={recentlyCompleted === "pos"}
          isUnlocking={unlockingStep === "pos"}
        />
        
        <DevicesStep
          isCompleted={getTaskData("devices")?.isCompleted || false}
          isLocked={isTaskLocked("devices")}
          data={getTaskData("devices")?.data}
          onUpdate={handleDevicesUpdate}
          isSaving={isUpdating}
          onStepComplete={handleDevicesComplete}
          isJustCompleted={recentlyCompleted === "devices"}
          isUnlocking={unlockingStep === "devices"}
        />
        
        <LegalStep
          isCompleted={getTaskData("legal")?.isCompleted || false}
          isLocked={isTaskLocked("legal")}
          data={getTaskData("legal")?.data}
          onSign={handleLegalSign}
          onDraftSave={onSaveLegalDraft}
          isSubmitting={isSigningLegal}
          isJustCompleted={recentlyCompleted === "legal"}
          isUnlocking={unlockingStep === "legal"}
          hotelLegalEntity={hotelLegalEntity}
        />
      </Accordion>
    </VenueProvider>
  );
}
