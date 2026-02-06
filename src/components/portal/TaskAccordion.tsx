import { useState } from "react";
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
  onTaskUpdate: (taskKey: string, data: Record<string, unknown>) => void;
  onFileUpload: (taskKey: string, file: File, fieldName: string) => void;
  venues?: Venue[];
  onVenuesChange?: (venues: Venue[]) => void;
  onVenuesSave?: () => void;
  isUpdating?: boolean;
}

export function TaskAccordion({ 
  tasks, 
  onTaskUpdate, 
  onFileUpload,
  venues = [],
  onVenuesChange,
  onVenuesSave,
  isUpdating
}: TaskAccordionProps) {
  const getTaskData = (key: string) => tasks.find(t => t.key === key);
  
  const isTaskLocked = (key: string) => {
    const taskOrder = ["legal", "brand", "venue"];
    const taskIndex = taskOrder.indexOf(key);
    if (taskIndex <= 0) return false;
    
    const prevTaskKey = taskOrder[taskIndex - 1];
    const prevTask = tasks.find(t => t.key === prevTaskKey);
    return prevTask ? !prevTask.isCompleted : false;
  };

  const handleLegalSign = (signatureDataUrl: string) => {
    onTaskUpdate("legal", { 
      pilot_signed: true, 
      pilot_signature: signatureDataUrl,
      signed_at: new Date().toISOString()
    });
  };

  const handleBrandSave = (data: { brand_palette: string[]; logos: Record<string, File> }) => {
    onTaskUpdate("brand", { brand_palette: data.brand_palette });
  };

  const handleLogoUpload = (file: File, variant: string) => {
    onFileUpload("brand", file, `logo_${variant}`);
  };

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      <LegalStep
        isCompleted={getTaskData("legal")?.isCompleted || false}
        isLocked={isTaskLocked("legal")}
        data={getTaskData("legal")?.data}
        onSign={handleLegalSign}
        isSubmitting={isUpdating}
      />
      
      <BrandStep
        isCompleted={getTaskData("brand")?.isCompleted || false}
        isLocked={isTaskLocked("brand")}
        data={getTaskData("brand")?.data}
        onSave={handleBrandSave}
        onLogoUpload={handleLogoUpload}
        isSaving={isUpdating}
      />
      
      <VenueStep
        isCompleted={getTaskData("venue")?.isCompleted || false}
        isLocked={isTaskLocked("venue")}
        data={getTaskData("venue")?.data}
        venues={venues}
        onVenuesChange={onVenuesChange || (() => {})}
        onSave={onVenuesSave || (() => {})}
        isSaving={isUpdating}
      />
    </Accordion>
  );
}
