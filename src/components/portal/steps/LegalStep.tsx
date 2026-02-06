import { useState } from "react";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Check, FileSignature, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewSignModal } from "../ReviewSignModal";

interface LegalStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  data?: Record<string, unknown>;
  onSign: (signatureDataUrl: string) => void;
  isSubmitting?: boolean;
}

export function LegalStep({ isCompleted, isLocked, data, onSign, isSubmitting }: LegalStepProps) {
  const [showPilotModal, setShowPilotModal] = useState(false);

  return (
    <>
      <AccordionItem 
        value="legal" 
        className={cn(
          "border rounded-lg px-4 bg-card",
          isLocked && "opacity-50 pointer-events-none"
        )}
        disabled={isLocked}
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              isCompleted 
                ? "bg-success text-success-foreground" 
                : "bg-muted text-muted-foreground"
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
              data?.pilot_signed ? "border-success/50 bg-success/5" : ""
            )}>
              <div className="flex items-center gap-3">
                <FileSignature className={cn(
                  "w-5 h-5",
                  data?.pilot_signed ? "text-success" : "text-muted-foreground"
                )} />
                <div>
                  <p className="font-medium text-sm">Pilot Agreement</p>
                  <p className="text-xs text-muted-foreground">
                    {data?.pilot_signed ? "Signed" : "Required to proceed"}
                  </p>
                </div>
              </div>
              {data?.pilot_signed ? (
                <span className="flex items-center gap-1 text-xs text-success font-medium">
                  <Check className="w-3 h-3" />
                  Signed
                </span>
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
      />
    </>
  );
}
