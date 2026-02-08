import { useState, useCallback } from "react";
import { Accordion } from "@/components/ui/accordion";
import { LegalStep, BrandStep, VenueStep, PosStep, DevicesStep } from "./steps";
import type { Venue } from "./VenueCard";

interface OnboardingTask {
  key: string;
  name: string;
  isCompleted: boolean;
  data?: Record<string, unknown>;
}

interface LegalEntityData {
  property_name?: string;
  legal_entity_name?: string;
  billing_address?: string;
  authorized_signer_name?: string;
  authorized_signer_title?: string;
}

interface TaskAccordionProps {
  tasks: OnboardingTask[];
  onLegalSign: (signatureDataUrl: string, legalEntityData: LegalEntityData) => void;
  onTaskUpdate: (taskKey: string, data: Record<string, unknown>) => void;
  onFileUpload: (taskKey: string, file: File, fieldName: string) => void;
  venues?: Venue[];
  onVenuesChange?: (venues: Venue[]) => void;
  onVenuesSave?: () => void;
  isSigningLegal?: boolean;
  isUpdating?: boolean;
  hotelLegalEntity?: LegalEntityData;
}

const TASK_ORDER = ["brand", "venue", "pos", "devices", "legal"];

export function TaskAccordion({ 
  tasks, 
  onLegalSign,
  onTaskUpdate, 
  onFileUpload,
  venues = [],
  onVenuesChange,
  onVenuesSave,
  isSigningLegal,
  isUpdating,
  hotelLegalEntity
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

  const handleBrandSave = async (data: { brand_palette: string[]; logos: Record<string, File> }) => {
    onTaskUpdate("brand", { brand_palette: data.brand_palette });
  };

  const handleLogoUpload = (file: File, variant: string) => {
    onFileUpload("brand", file, `logo_${variant}`);
  };

  const handleLegalSign = (signatureDataUrl: string, legalEntityData: LegalEntityData) => {
    onLegalSign(signatureDataUrl, legalEntityData);
    // Trigger step completion after a brief delay for the save to process
    setTimeout(() => handleStepComplete("legal"), 100);
  };

  const handleBrandComplete = () => {
    handleStepComplete("brand");
  };

  const handleVenueSave = async () => {
    if (onVenuesSave) {
      await onVenuesSave();
    }
  };

  const handleVenueComplete = () => {
    handleStepComplete("venue");
  };

  const handlePosUpdate = (data: { provider: string; status: string }) => {
    onTaskUpdate("pos", data);
  };

  const handlePosComplete = () => {
    handleStepComplete("pos");
  };

  const handleDevicesUpdate = (data: { use_daze_tablets: boolean; tablet_count?: number }) => {
    onTaskUpdate("devices", data);
  };

  const handleDevicesComplete = () => {
    handleStepComplete("devices");
  };

  return (
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
        isSaving={isUpdating}
        onStepComplete={handleBrandComplete}
        isJustCompleted={recentlyCompleted === "brand"}
        isUnlocking={unlockingStep === "brand"}
      />
      
      <VenueStep
        isCompleted={getTaskData("venue")?.isCompleted || false}
        isLocked={isTaskLocked("venue")}
        data={getTaskData("venue")?.data}
        venues={venues}
        onVenuesChange={onVenuesChange || (() => {})}
        onSave={handleVenueSave}
        isSaving={isUpdating}
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
        isSubmitting={isSigningLegal}
        isJustCompleted={recentlyCompleted === "legal"}
        isUnlocking={unlockingStep === "legal"}
        hotelLegalEntity={hotelLegalEntity}
      />
    </Accordion>
  );
}
