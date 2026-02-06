import { useState, useEffect } from "react";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, FileSignature, Lock, Eye, Building2, MapPin, User, Briefcase, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewSignModal } from "../ReviewSignModal";
import { StepCompletionEffect } from "../StepCompletionEffect";
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
  onSaveLegalEntity?: (data: LegalEntityData) => void;
  isSavingLegalEntity?: boolean;
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
  onSaveLegalEntity,
  isSavingLegalEntity,
  isSubmitting,
  isJustCompleted,
  isUnlocking,
  hotelLegalEntity
}: LegalStepProps) {
  const [showPilotModal, setShowPilotModal] = useState(false);
  
  // Legal entity form state
  const [legalEntityName, setLegalEntityName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [authorizedSignerName, setAuthorizedSignerName] = useState("");
  const [authorizedSignerTitle, setAuthorizedSignerTitle] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if already signed
  const pilotSigned = !!data?.pilot_signed;
  const signatureUrl = data?.signature_url as string | undefined;
  const signedAt = data?.signed_at as string | undefined;

  // Format signed date for display
  const signedDateDisplay = signedAt 
    ? format(new Date(signedAt), "MMM d, yyyy")
    : null;

  // Initialize form from hotel data
  useEffect(() => {
    if (hotelLegalEntity) {
      setLegalEntityName(hotelLegalEntity.legal_entity_name || "");
      setBillingAddress(hotelLegalEntity.billing_address || "");
      setAuthorizedSignerName(hotelLegalEntity.authorized_signer_name || "");
      setAuthorizedSignerTitle(hotelLegalEntity.authorized_signer_title || "");
    }
  }, [hotelLegalEntity]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = 
      legalEntityName !== (hotelLegalEntity?.legal_entity_name || "") ||
      billingAddress !== (hotelLegalEntity?.billing_address || "") ||
      authorizedSignerName !== (hotelLegalEntity?.authorized_signer_name || "") ||
      authorizedSignerTitle !== (hotelLegalEntity?.authorized_signer_title || "");
    setHasUnsavedChanges(hasChanges);
  }, [legalEntityName, billingAddress, authorizedSignerName, authorizedSignerTitle, hotelLegalEntity]);

  // Check if form is complete enough to sign
  const isFormComplete = 
    legalEntityName.trim().length > 0 &&
    authorizedSignerName.trim().length > 0;

  const handleSaveLegalEntity = () => {
    if (onSaveLegalEntity) {
      onSaveLegalEntity({
        legal_entity_name: legalEntityName.trim(),
        billing_address: billingAddress.trim(),
        authorized_signer_name: authorizedSignerName.trim(),
        authorized_signer_title: authorizedSignerTitle.trim(),
      });
    }
  };

  const handleSign = (signatureDataUrl: string) => {
    onSign(signatureDataUrl, {
      legal_entity_name: legalEntityName.trim(),
      billing_address: billingAddress.trim(),
      authorized_signer_name: authorizedSignerName.trim(),
      authorized_signer_title: authorizedSignerTitle.trim(),
    });
    setShowPilotModal(false);
  };

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
          <div className="space-y-6 pt-2">
            {/* Legal Entity Information Section */}
            <div className="space-y-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                Legal Entity Information
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                This information will appear on the pilot agreement
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Legal Entity Name */}
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="legal-entity-name" className="text-sm flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Legal Entity Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="legal-entity-name"
                    placeholder="e.g., Acme Hotels LLC"
                    value={legalEntityName}
                    onChange={(e) => setLegalEntityName(e.target.value)}
                    disabled={pilotSigned}
                    className={cn(
                      "transition-all",
                      pilotSigned && "opacity-60 cursor-not-allowed"
                    )}
                  />
                </div>

                {/* Billing Address */}
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="billing-address" className="text-sm flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Billing Address
                  </Label>
                  <Textarea
                    id="billing-address"
                    placeholder="Street address, City, State, ZIP"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    disabled={pilotSigned}
                    rows={2}
                    className={cn(
                      "resize-none transition-all",
                      pilotSigned && "opacity-60 cursor-not-allowed"
                    )}
                  />
                </div>

                {/* Authorized Signer Name */}
                <div className="space-y-2">
                  <Label htmlFor="signer-name" className="text-sm flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Authorized Signer <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="signer-name"
                    placeholder="Full name"
                    value={authorizedSignerName}
                    onChange={(e) => setAuthorizedSignerName(e.target.value)}
                    disabled={pilotSigned}
                    className={cn(
                      "transition-all",
                      pilotSigned && "opacity-60 cursor-not-allowed"
                    )}
                  />
                </div>

                {/* Authorized Signer Title */}
                <div className="space-y-2">
                  <Label htmlFor="signer-title" className="text-sm flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                    Title / Position
                  </Label>
                  <Input
                    id="signer-title"
                    placeholder="e.g., General Manager"
                    value={authorizedSignerTitle}
                    onChange={(e) => setAuthorizedSignerTitle(e.target.value)}
                    disabled={pilotSigned}
                    className={cn(
                      "transition-all",
                      pilotSigned && "opacity-60 cursor-not-allowed"
                    )}
                  />
                </div>
              </div>

              {/* Save Button (only show when not signed and has changes) */}
              {!pilotSigned && hasUnsavedChanges && onSaveLegalEntity && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveLegalEntity}
                    disabled={isSavingLegalEntity}
                    className="gap-2"
                  >
                    {isSavingLegalEntity ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Save Draft
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Pilot Agreement */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
              pilotSigned 
                ? "bg-success/5 shadow-sm" 
                : "bg-secondary/50 shadow-sm hover:shadow-md"
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
                  disabled={!isFormComplete}
                  className="gap-2"
                >
                  <FileSignature className="w-4 h-4" />
                  Review & Sign
                </Button>
              )}
            </div>

            {/* Hint when form incomplete */}
            {!pilotSigned && !isFormComplete && (
              <p className="text-xs text-muted-foreground text-center">
                Please complete the required fields above before signing
              </p>
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
        signerName={authorizedSignerName}
        signerTitle={authorizedSignerTitle}
        legalEntityName={legalEntityName}
      />
    </>
  );
}
