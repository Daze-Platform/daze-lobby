import { useState } from "react";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileSignature, Lock, Eye, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewSignModal } from "../ReviewSignModal";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { IconContainer } from "@/components/ui/icon-container";
import { StepBadge, type StepBadgeStatus } from "@/components/ui/step-badge";
import { format } from "date-fns";

interface LegalEntityData {
  property_name?: string;
  legal_entity_name?: string;
  billing_address?: string;
  authorized_signer_name?: string;
  authorized_signer_title?: string;
}

interface LegalStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  isActive?: boolean;
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
  isActive = false,
  data, 
  onSign,
  isSubmitting,
  isJustCompleted,
  isUnlocking,
  hotelLegalEntity
}: LegalStepProps) {

  // Derive badge status
  const badgeStatus: StepBadgeStatus = isCompleted 
    ? "complete" 
    : isLocked 
      ? "locked" 
      : isActive 
        ? "active" 
        : "pending";
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
              step="A" 
              status={badgeStatus} 
              isJustCompleted={isJustCompleted} 
            />
            <div className="text-left min-w-0">
              <p className="font-semibold text-xs sm:text-sm md:text-base truncate">Legal & Agreements</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Review and sign required agreements</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 sm:pb-4">
          <div className="space-y-2.5 sm:space-y-4 pt-1 sm:pt-2">
            {/* Pilot Agreement */}
            <div className={cn(
              "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-xl transition-all duration-300 group border-0",
              pilotSigned 
                ? "bg-success/5 shadow-soft" 
                : "bg-card shadow-soft hover:shadow-soft-md hover:-translate-y-0.5"
            )}>
              <div className="flex items-center gap-3 md:gap-4">
                <IconContainer 
                  icon={FileSignature} 
                  size="md"
                  variant={pilotSigned ? "success" : "default"}
                  className="flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm">Pilot Agreement</p>
                  <p className="text-xs text-muted-foreground truncate">
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
                  className="gap-2 w-full sm:w-auto min-h-[44px]"
                >
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                  View Agreement
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => setShowPilotModal(true)}
                  className="gap-2 w-full sm:w-auto min-h-[44px]"
                >
                  <FileSignature className="w-4 h-4" strokeWidth={1.5} />
                  Review & Sign
                </Button>
              )}
            </div>

            {/* Entity summary if saved */}
            {entityName && !pilotSigned && (
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-xl border-0">
                <Building2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-xs text-muted-foreground">
                  Draft saved for <span className="font-medium text-foreground">{entityName}</span>
                </p>
              </div>
            )}

            {/* Master Service Agreement (Locked) */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border-0 opacity-60">
              <div className="flex items-center gap-4">
                <IconContainer 
                  icon={Lock} 
                  size="md"
                  variant="muted"
                />
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Master Service Agreement</p>
                  <p className="text-xs text-muted-foreground/70">Available after pilot completion</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.5} />
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
