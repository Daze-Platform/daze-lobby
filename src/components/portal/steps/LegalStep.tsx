import { useState } from "react";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Check, FileSignature, Lock, Eye, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewSignModal } from "../ReviewSignModal";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { IconContainer } from "@/components/ui/icon-container";
import { format } from "date-fns";

interface LegalEntityData {
  legal_entity_name?: string;
  billing_address?: string;
  authorized_signer_name?: string;
  authorized_signer_title?: string;
}

interface LegalStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  data?: Record<string, unknown>;
  onSign: (signatureDataUrl: string, legalEntityData: LegalEntityData) => void;
  isSubmitting?: boolean;
  isJustCompleted?: boolean;
  isUnlocking?: boolean;
  // Pre-populated from hotel record
  hotelLegalEntity?: LegalEntityData;
}

export function LegalStep({ 
  isCompleted, 
  isLocked, 
  data, 
  onSign,
  isSubmitting,
  isJustCompleted,
  isUnlocking,
  hotelLegalEntity
}: LegalStepProps) {
  const [showPilotModal, setShowPilotModal] = useState(false);

  // Check if already signed
  const pilotSigned = !!data?.pilot_signed;
  const signatureUrl = data?.signature_url as string | undefined;
  const signedAt = data?.signed_at as string | undefined;

  // Format signed date for display
  const signedDateDisplay = signedAt 
    ? format(new Date(signedAt), "MMM d, yyyy")
    : null;

  const handleSign = (signatureDataUrl: string, legalEntityData: LegalEntityData) => {
    onSign(signatureDataUrl, legalEntityData);
    setShowPilotModal(false);
  };

  // Entity summary for display
  const entityName = hotelLegalEntity?.legal_entity_name;

  return (
    <>
      <AccordionItem 
        value="legal" 
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
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              isCompleted 
                ? "bg-success text-success-foreground" 
                : "bg-muted text-muted-foreground",
              isJustCompleted && "animate-pop"
            )}>
              {isCompleted ? <Check className="w-4 h-4 animate-pop" /> : "A"}
            </div>
            <div className="text-left">
              <p className="font-medium">Legal & Agreements</p>
              <p className="text-sm text-muted-foreground">Review and sign required agreements</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-4 pt-2">
            {/* Pilot Agreement */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl transition-all duration-200 group",
              pilotSigned 
                ? "bg-success/5 shadow-sm" 
                : "bg-secondary/50 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            )}>
              <div className="flex items-center gap-4">
                <IconContainer 
                  icon={FileSignature} 
                  size="md"
                  variant={pilotSigned ? "success" : "default"}
                />
                <div>
                  <p className="font-medium text-sm">Pilot Agreement</p>
                  <p className="text-xs text-muted-foreground">
                    {pilotSigned && signedDateDisplay
                      ? `Signed on ${signedDateDisplay}` 
                      : "Review, enter entity details, and sign"
                    }
                  </p>
                </div>
              </div>
              {pilotSigned ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowPilotModal(true)}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                  View Agreement
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => setShowPilotModal(true)}
                  className="gap-2"
                >
                  <FileSignature className="w-4 h-4" strokeWidth={1.5} />
                  Review & Sign
                </Button>
              )}
            </div>

            {/* Entity summary if saved */}
            {entityName && !pilotSigned && (
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Draft saved for <span className="font-medium text-foreground">{entityName}</span>
                </p>
              </div>
            )}

            {/* Master Service Agreement (Locked) */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 opacity-50">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Master Service Agreement</p>
                  <p className="text-xs text-muted-foreground">Available after pilot completion</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <ReviewSignModal
        open={showPilotModal}
        onOpenChange={setShowPilotModal}
        documentTitle="Pilot Agreement"
        onSign={handleSign}
        isSubmitting={isSubmitting}
        existingSignatureUrl={signatureUrl}
        signedAt={signedAt}
        initialLegalEntity={hotelLegalEntity}
      />
    </>
  );
}
