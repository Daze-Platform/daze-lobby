import { useState, useCallback } from "react";
import { Accordion } from "@/components/ui/accordion";
import { LegalStep, BrandStep, VenueStep } from "./steps";
import type { Venue } from "./VenueCard";

interface OnboardingTask {
  key: string;
  name: string;
  isCompleted: boolean;
  data?: Record<string, unknown>;
}

interface TaskAccordionProps {
  tasks: OnboardingTask[];
  onLegalSign: (signatureDataUrl: string) => void;
  onTaskUpdate: (taskKey: string, data: Record<string, unknown>) => void;
  onFileUpload: (taskKey: string, file: File, fieldName: string) => void;
  venues?: Venue[];
  onVenuesChange?: (venues: Venue[]) => void;
  onVenuesSave?: () => void;
  isSigningLegal?: boolean;
  isUpdating?: boolean;
}

const TASK_ORDER = ["legal", "brand", "venue"];

export function TaskAccordion({ 
  tasks, 
  onLegalSign,
  onTaskUpdate, 
  onFileUpload,
  venues = [],
  onVenuesChange,
  onVenuesSave,
  isSigningLegal,
  isUpdating
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

  const handleLegalSign = (signatureDataUrl: string) => {
    onLegalSign(signatureDataUrl);
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

  return (
    <Accordion 
      type="single" 
      collapsible 
      className="w-full space-y-3"
      value={accordionValue}
      onValueChange={setAccordionValue}
    >
      <LegalStep
        isCompleted={getTaskData("legal")?.isCompleted || false}
        isLocked={isTaskLocked("legal")}
        data={getTaskData("legal")?.data}
        onSign={handleLegalSign}
        isSubmitting={isSigningLegal}
        isJustCompleted={recentlyCompleted === "legal"}
        isUnlocking={unlockingStep === "legal"}
      />
      
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
    </Accordion>
  );
}
