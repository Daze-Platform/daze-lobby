import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignaturePad, SignaturePadRef } from "./SignaturePad";
import { Check, Loader2, Shield, Calendar, Download } from "lucide-react";
import { format } from "date-fns";

interface ReviewSignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  onSign: (signatureDataUrl: string) => void;
  isSubmitting?: boolean;
  // Existing signature data (for signed state)
  existingSignatureUrl?: string;
  signedAt?: string;
}

const PILOT_AGREEMENT_TEXT = `PILOT AGREEMENT

This Pilot Agreement ("Agreement") is entered into as of the date of electronic signature below.

1. PURPOSE
This Pilot Agreement establishes the terms and conditions under which the Hotel Partner ("Partner") will participate in the Daze platform pilot program.

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
Partner agrees to:
a) Provide accurate brand assets and menu information
b) Designate a primary point of contact
c) Ensure staff participation in training sessions
d) Maintain operational hours as specified
e) Provide timely feedback on platform performance

5. FEES AND PAYMENT
During the pilot period, Partner shall pay a reduced pilot fee as specified in the attached Schedule A. Standard pricing shall apply following the pilot period if Partner elects to continue.

6. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of proprietary information shared during the pilot program.

7. DATA USAGE
Partner grants Daze the right to collect and analyze anonymized operational data for the purpose of improving the platform and services.

8. TERMINATION
Either party may terminate this Agreement with thirty (30) days written notice. Upon termination, Daze shall remove all installed hardware within fourteen (14) business days.

9. LIMITATION OF LIABILITY
Neither party shall be liable for indirect, incidental, or consequential damages arising from this Agreement.

10. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Delaware.

By signing below, both parties acknowledge and agree to the terms set forth in this Pilot Agreement.`;

export function ReviewSignModal({
  open,
  onOpenChange,
  documentTitle,
  onSign,
  isSubmitting = false,
  existingSignatureUrl,
  signedAt,
}: ReviewSignModalProps) {
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const isSigned = !!existingSignatureUrl;

  const handleSignatureChange = (hasSig: boolean) => {
    setHasSignature(hasSig);
  };

  const handleConfirmSign = () => {
    const dataUrl = signaturePadRef.current?.getDataUrl();
    if (dataUrl) {
      onSign(dataUrl);
    }
  };

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setHasSignature(false);
  };

  const handleDownload = () => {
    const blob = new Blob([PILOT_AGREEMENT_TEXT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Daze_Pilot_Agreement.txt";
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
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
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
              : "Please review the agreement carefully before signing"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
          {/* Document View */}
          <div className="border-r flex flex-col min-h-0">
            <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between shrink-0">
              <p className="text-sm font-medium text-muted-foreground">Agreement Document</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-4 text-sm leading-relaxed text-foreground">
                {PILOT_AGREEMENT_TEXT.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Signature Panel */}
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-2 bg-muted/50 border-b shrink-0">
              <p className="text-sm font-medium text-muted-foreground">
                {isSigned ? "Digital Signature" : "Your Signature"}
              </p>
            </div>
            <div className="flex-1 p-6 flex flex-col min-h-0">
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

                  {/* Signature Image Display */}
                  <div className="border rounded-lg p-4 bg-white">
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
                  <div className="flex-1 flex flex-col min-h-0 overflow-auto">
                    <p className="text-sm text-muted-foreground mb-4">
                      By signing below, you agree to the terms and conditions outlined in the Pilot Agreement.
                    </p>
                    <SignaturePad 
                      ref={signaturePadRef}
                      onSignatureChange={handleSignatureChange} 
                    />
                  </div>

                  <div className="mt-auto pt-4 space-y-3 border-t shrink-0">
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClear}
                        disabled={!hasSignature || isSubmitting}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={handleConfirmSign}
                        disabled={!hasSignature || isSubmitting}
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
