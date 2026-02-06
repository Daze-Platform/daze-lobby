import { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignaturePad, SignaturePadRef } from "./SignaturePad";
import { Check, Loader2, Shield, Calendar, Download, Building2, MapPin, User, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { IconContainer } from "@/components/ui/icon-container";

interface LegalEntityData {
  legal_entity_name?: string;
  billing_address?: string;
  authorized_signer_name?: string;
  authorized_signer_title?: string;
}

interface ReviewSignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  onSign: (signatureDataUrl: string, legalEntityData: LegalEntityData) => void;
  isSubmitting?: boolean;
  // Existing signature data (for signed state)
  existingSignatureUrl?: string;
  signedAt?: string;
  // Pre-filled data from database
  initialLegalEntity?: LegalEntityData;
}

// Template for dynamic text injection
const createAgreementText = (entity: LegalEntityData) => {
  const entityName = entity.legal_entity_name?.trim() || "[Legal Entity Name]";
  const address = entity.billing_address?.trim() || "[Registered Address]";
  const signerName = entity.authorized_signer_name?.trim() || "[Authorized Signer]";
  const signerTitle = entity.authorized_signer_title?.trim() || "[Title]";

  return `PILOT AGREEMENT

This Pilot Agreement ("Agreement") is entered into as of the date of electronic signature below by and between Daze Technologies, Inc. ("Daze") and ${entityName}, located at ${address} ("Partner"), represented by ${signerName}, ${signerTitle}.

1. PURPOSE
This Pilot Agreement establishes the terms and conditions under which the Partner will participate in the Daze platform pilot program.

2. PILOT PERIOD
The pilot period shall commence upon execution of this Agreement and continue for a period of ninety (90) days, unless terminated earlier in accordance with Section 8.

3. SERVICES PROVIDED
During the pilot period, Daze shall provide:
a) Access to the Daze ordering platform
b) Hardware installation and setup
c) Staff training and onboarding support
d) 24/7 technical support
e) Analytics and reporting dashboard

4. PARTNER OBLIGATIONS
${entityName} agrees to:
a) Provide accurate brand assets and menu information
b) Designate ${signerName} as the primary point of contact
c) Ensure staff participation in training sessions
d) Maintain operational hours as specified
e) Provide timely feedback on platform performance

5. FEES AND PAYMENT
During the pilot period, ${entityName} shall pay a reduced pilot fee as specified in the attached Schedule A. Standard pricing shall apply following the pilot period if Partner elects to continue.

6. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of proprietary information shared during the pilot program.

7. DATA USAGE
${entityName} grants Daze the right to collect and analyze anonymized operational data for the purpose of improving the platform and services.

8. TERMINATION
Either party may terminate this Agreement with thirty (30) days written notice. Upon termination, Daze shall remove all installed hardware within fourteen (14) business days.

9. LIMITATION OF LIABILITY
Neither party shall be liable for indirect, incidental, or consequential damages arising from this Agreement.

10. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Delaware.

By signing below, ${signerName} on behalf of ${entityName} acknowledges and agrees to the terms set forth in this Pilot Agreement.`;
};

// Highlight injected values in the text
const HighlightedText = ({ text, entity }: { text: string; entity: LegalEntityData }) => {
  const entityName = entity.legal_entity_name?.trim();
  const address = entity.billing_address?.trim();
  const signerName = entity.authorized_signer_name?.trim();
  const signerTitle = entity.authorized_signer_title?.trim();

  // Create regex patterns for each filled value
  const patterns: { value: string; isPlaceholder: boolean }[] = [];
  
  if (entityName) patterns.push({ value: entityName, isPlaceholder: false });
  if (address) patterns.push({ value: address, isPlaceholder: false });
  if (signerName) patterns.push({ value: signerName, isPlaceholder: false });
  if (signerTitle) patterns.push({ value: signerTitle, isPlaceholder: false });

  // Also highlight placeholders
  const placeholders = [
    "[Legal Entity Name]",
    "[Registered Address]",
    "[Authorized Signer]",
    "[Title]"
  ];

  if (!entityName && !address && !signerName && !signerTitle) {
    // No values filled yet - just show text with placeholder styling
    let result = text;
    placeholders.forEach(ph => {
      result = result.split(ph).join(`|||PLACEHOLDER:${ph}|||`);
    });

    return (
      <>
        {result.split("|||").map((part, i) => {
          if (part.startsWith("PLACEHOLDER:")) {
            const placeholder = part.replace("PLACEHOLDER:", "");
            return (
              <span key={i} className="text-muted-foreground italic bg-muted/50 px-1 rounded">
                {placeholder}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  }

  // Split by all dynamic values and highlight them
  const allValues = patterns.map(p => p.value).filter(Boolean);
  
  if (allValues.length === 0) {
    return <>{text}</>;
  }

  // Create a regex that matches any of the values
  const escapedValues = allValues.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedValues.join('|')})`, 'g');
  
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        const isHighlighted = allValues.includes(part);
        if (isHighlighted) {
          return (
            <span key={i} className="text-primary font-semibold">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export function ReviewSignModal({
  open,
  onOpenChange,
  documentTitle,
  onSign,
  isSubmitting = false,
  existingSignatureUrl,
  signedAt,
  initialLegalEntity,
}: ReviewSignModalProps) {
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [hasSignature, setHasSignature] = useState(false);
  
  // Form state
  const [legalEntityName, setLegalEntityName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [authorizedSignerName, setAuthorizedSignerName] = useState("");
  const [authorizedSignerTitle, setAuthorizedSignerTitle] = useState("");

  const isSigned = !!existingSignatureUrl;

  // Pre-fill from saved data when modal opens
  useEffect(() => {
    if (open && initialLegalEntity) {
      setLegalEntityName(initialLegalEntity.legal_entity_name || "");
      setBillingAddress(initialLegalEntity.billing_address || "");
      setAuthorizedSignerName(initialLegalEntity.authorized_signer_name || "");
      setAuthorizedSignerTitle(initialLegalEntity.authorized_signer_title || "");
    }
  }, [open, initialLegalEntity]);

  // Current entity data for real-time injection
  const currentEntity: LegalEntityData = useMemo(() => ({
    legal_entity_name: legalEntityName,
    billing_address: billingAddress,
    authorized_signer_name: authorizedSignerName,
    authorized_signer_title: authorizedSignerTitle,
  }), [legalEntityName, billingAddress, authorizedSignerName, authorizedSignerTitle]);

  // Generate agreement text with injected values
  const agreementText = useMemo(() => createAgreementText(currentEntity), [currentEntity]);

  // Form validation - all fields required
  const isFormValid = 
    legalEntityName.trim().length > 0 &&
    billingAddress.trim().length > 0 &&
    authorizedSignerName.trim().length > 0 &&
    authorizedSignerTitle.trim().length > 0;

  const handleSignatureChange = (hasSig: boolean) => {
    setHasSignature(hasSig);
  };

  const handleConfirmSign = () => {
    const dataUrl = signaturePadRef.current?.getDataUrl();
    if (dataUrl && isFormValid) {
      onSign(dataUrl, {
        legal_entity_name: legalEntityName.trim(),
        billing_address: billingAddress.trim(),
        authorized_signer_name: authorizedSignerName.trim(),
        authorized_signer_title: authorizedSignerTitle.trim(),
      });
    }
  };

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setHasSignature(false);
  };

  const handleDownload = () => {
    const blob = new Blob([agreementText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Daze_Pilot_Agreement_${legalEntityName.replace(/[^a-zA-Z0-9]/g, '_') || 'Draft'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formattedSignedDate = signedAt 
    ? format(new Date(signedAt), "MMMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {documentTitle}
            {isSigned && (
              <span className="inline-flex items-center gap-1 text-xs font-normal bg-success/10 text-success px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" />
                Signed
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSigned 
              ? "This agreement has been digitally signed and cannot be modified"
              : "Complete the entity information below. Your details will appear in the contract in real-time."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden min-h-0">
          {/* Left Panel: Form + Agreement Text */}
          <div className="border-r flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-6">
                {/* Entity Information Form */}
                {!isSigned && (
                  <div className="space-y-4 p-4 rounded-xl bg-secondary/40 border border-border/50">
                    <div className="flex items-center gap-3">
                      <IconContainer icon={Building2} size="sm" variant="primary" />
                      <div>
                        <h3 className="font-semibold text-sm">Entity Information</h3>
                        <p className="text-xs text-muted-foreground">
                          Complete all fields. Your information will appear in the contract below.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {/* Legal Entity Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-entity-name" className="text-xs flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                          Legal Entity Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="modal-entity-name"
                          placeholder="e.g., Pensacola Beach Hospitality Group, LLC"
                          value={legalEntityName}
                          onChange={(e) => setLegalEntityName(e.target.value)}
                          className="h-9"
                        />
                      </div>

                      {/* Registered Address */}
                      <div className="space-y-1.5">
                        <Label htmlFor="modal-address" className="text-xs flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          Registered Address <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="modal-address"
                          placeholder="Full street address, city, state, ZIP"
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          rows={2}
                          className="resize-none text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Authorized Signer Name */}
                        <div className="space-y-1.5">
                          <Label htmlFor="modal-signer-name" className="text-xs flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted-foreground" />
                            Authorized Signer <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="modal-signer-name"
                            placeholder="Full name"
                            value={authorizedSignerName}
                            onChange={(e) => setAuthorizedSignerName(e.target.value)}
                            className="h-9"
                          />
                        </div>

                        {/* Signer Title */}
                        <div className="space-y-1.5">
                          <Label htmlFor="modal-signer-title" className="text-xs flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                            Title <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="modal-signer-title"
                            placeholder="e.g., General Manager"
                            value={authorizedSignerTitle}
                            onChange={(e) => setAuthorizedSignerTitle(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Agreement Document */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Agreement Document</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownload}
                      className="h-7 gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Button>
                  </div>
                  <div className="p-4 bg-white dark:bg-background border rounded-lg text-sm leading-relaxed">
                    {agreementText.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-wrap mb-3 last:mb-0">
                        <HighlightedText text={paragraph} entity={currentEntity} />
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Signature */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b shrink-0">
              <p className="text-sm font-medium text-muted-foreground">
                {isSigned ? "Digital Signature" : "Your Signature"}
              </p>
            </div>
            <div className="flex-1 p-6 flex flex-col min-h-0 overflow-auto">
              {isSigned ? (
                /* ========== SIGNED STATE ========== */
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success mb-2">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-foreground">Agreement Signed</h3>
                    <p className="text-sm text-muted-foreground">
                      This document has been digitally signed and is legally binding.
                    </p>
                  </div>

                  {/* Entity Summary */}
                  {initialLegalEntity && (
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Entity:</span> <span className="font-medium">{initialLegalEntity.legal_entity_name}</span></p>
                      <p><span className="text-muted-foreground">Address:</span> <span className="font-medium">{initialLegalEntity.billing_address}</span></p>
                      <p><span className="text-muted-foreground">Signed by:</span> <span className="font-medium">{initialLegalEntity.authorized_signer_name}, {initialLegalEntity.authorized_signer_title}</span></p>
                    </div>
                  )}

                  {/* Signature Image Display */}
                  <div className="border rounded-lg p-4 bg-white dark:bg-background">
                    <p className="text-xs text-muted-foreground mb-2">Signature:</p>
                    <div className="border-b-2 border-muted pb-2">
                      <img 
                        src={existingSignatureUrl} 
                        alt="Digital Signature"
                        className="h-[100px] w-auto mx-auto object-contain"
                      />
                    </div>
                    {formattedSignedDate && (
                      <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Digitally Signed on {formattedSignedDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      This signature is securely stored and timestamped. 
                      The document cannot be modified after signing.
                    </p>
                  </div>
                </div>
              ) : (
                /* ========== SIGNING STATE ========== */
                <>
                  <div className="flex-1 flex flex-col min-h-0">
                    {!isFormValid && (
                      <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                        <p className="text-xs text-warning font-medium">
                          Complete all entity information fields to enable signing.
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-4">
                      By signing below, you agree to the terms and conditions outlined in the Pilot Agreement on behalf of <span className="font-semibold text-foreground">{legalEntityName || "[Your Entity]"}</span>.
                    </p>
                    <div className={cn(
                      "transition-opacity",
                      !isFormValid && "opacity-50 pointer-events-none"
                    )}>
                      <SignaturePad 
                        ref={signaturePadRef}
                        onSignatureChange={handleSignatureChange} 
                      />
                    </div>
                  </div>

                  <div className="mt-auto pt-4 space-y-3 border-t shrink-0">
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClear}
                        disabled={!hasSignature || isSubmitting || !isFormValid}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={handleConfirmSign}
                        disabled={!hasSignature || isSubmitting || !isFormValid}
                        className="flex-[2] gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Confirm & Sign
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Your signature will be securely stored and timestamped
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
