import { useState } from "react";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Check, FileSignature, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewSignModal } from "../ReviewSignModal";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { format } from "date-fns";

interface LegalStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  data?: Record<string, unknown>;
  onSign: (signatureDataUrl: string) => void;
  isSubmitting?: boolean;
  isJustCompleted?: boolean;
  isUnlocking?: boolean;
}

export function LegalStep({ 
  isCompleted, 
  isLocked, 
  data, 
  onSign, 
  isSubmitting,
  isJustCompleted,
  isUnlocking
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

  return (
    <>
      <AccordionItem 
        value="legal" 
        className={cn(
          "border rounded-lg px-4 bg-card relative overflow-hidden transition-all duration-300",
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
              {isCompleted ? <Check className="w-4 h-4" /> : "A"}
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
              "flex items-center justify-between p-4 border rounded-lg",
              pilotSigned ? "border-success/50 bg-success/5" : ""
            )}>
              <div className="flex items-center gap-3">
                <FileSignature className={cn(
                  "w-5 h-5",
                  pilotSigned ? "text-success" : "text-muted-foreground"
                )} />
                <div>
                  <p className="font-medium text-sm">Pilot Agreement</p>
                  <p className="text-xs text-muted-foreground">
                    {pilotSigned && signedDateDisplay
                      ? `Signed on ${signedDateDisplay}` 
                      : "Required to proceed"
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
                  <Eye className="w-4 h-4" />
                  View Signature
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => setShowPilotModal(true)}
                  className="gap-2"
                >
                  <FileSignature className="w-4 h-4" />
                  Review & Sign
                </Button>
              )}
            </div>

            {/* Master Service Agreement (Locked) */}
            <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
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
        onSign={(signatureDataUrl) => {
          onSign(signatureDataUrl);
          setShowPilotModal(false);
        }}
        isSubmitting={isSubmitting}
        existingSignatureUrl={signatureUrl}
        signedAt={signedAt}
      />
    </>
  );
}
