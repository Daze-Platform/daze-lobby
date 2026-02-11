import { useState, useRef, useEffect, useMemo, useDeferredValue, memo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SignaturePad, SignaturePadRef } from "./SignaturePad";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Check, Loader2, Shield, Calendar as CalendarIcon, Download, Building2, MapPin, User, Briefcase, Hotel, ChevronDown, Mail, Store, Cpu, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { IconContainer } from "@/components/ui/icon-container";
import { generateAgreementPdf } from "@/lib/generateAgreementPdf";
import type { PilotAgreementData } from "@/types/pilotAgreement";

interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

// Helper to parse address string into structured data
const parseAddress = (address?: string): AddressData => {
  if (!address) return {};
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const stateZip = parts[2].split(' ').filter(Boolean);
    return {
      street: parts[0],
      city: parts[1],
      state: stateZip[0] || '',
      zip: stateZip.slice(1).join(' ') || '',
    };
  } else if (parts.length === 2) {
    const stateZip = parts[1].split(' ').filter(Boolean);
    return {
      street: parts[0],
      city: '',
      state: stateZip[0] || '',
      zip: stateZip.slice(1).join(' ') || '',
    };
  }
  return { street: address };
};

// Helper to format address data into string
const formatAddress = (addr: AddressData): string => {
  const parts: string[] = [];
  if (addr.street?.trim()) parts.push(addr.street.trim());
  if (addr.city?.trim()) parts.push(addr.city.trim());
  if (addr.state?.trim() || addr.zip?.trim()) {
    parts.push(`${addr.state?.trim() || ''} ${addr.zip?.trim() || ''}`.trim());
  }
  return parts.join(', ');
};

interface ReviewSignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  onSign: (signatureDataUrl: string, data: PilotAgreementData) => void;
  onDraftSave?: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
  existingSignatureUrl?: string;
  signedAt?: string;
  initialLegalEntity?: PilotAgreementData;
}

// Full 13-section agreement text with dynamic injection
const createAgreementText = (d: PilotAgreementData) => {
  const name = d.legal_entity_name?.trim() || "[Client Legal Name]";
  const dba = d.dba_name?.trim() || "[DBA]";
  const addr = d.billing_address?.trim() || "[Address]";
  const contact = d.authorized_signer_name?.trim() || "[Primary Contact]";
  const title = d.authorized_signer_title?.trim() || "[Title]";
  const email = d.contact_email?.trim() || "[Email]";

  const outlets = (d.covered_outlets || []).filter(o => o.trim());
  const outletLines = outlets.length > 0
    ? outlets.map((o, i) => `${i + 1}. ${o}`).join("\n")
    : "1. _______________\n2. _______________\n3. _______________\n4. _______________";

  const hwNone = d.hardware_option !== "daze_provided" ? "[X]" : "[ ]";
  const hwDaze = d.hardware_option === "daze_provided" ? "[X]" : "[ ]";

  const startDate = d.start_date ? format(new Date(d.start_date), "MMMM d, yyyy") : "_______________";
  const termDays = d.pilot_term_days != null ? String(d.pilot_term_days) : "________";

  const pNone = d.pricing_model === "none" ? "[X]" : "[ ]";
  const pSub = d.pricing_model === "subscription" ? "[X]" : "[ ]";
  const pDaze = d.pricing_model === "daze_rev_share" ? "[X]" : "[ ]";
  const pClient = d.pricing_model === "client_rev_share" ? "[X]" : "[ ]";
  const pAmt = d.pricing_amount?.trim() || "________";

  const posSystem = d.pos_system?.trim() || "_______________";
  const posVersion = d.pos_version?.trim() || "_______________";
  const posApiKey = d.pos_api_key?.trim() || "_______________";
  const posContact = d.pos_contact?.trim() || "_______________";

  return `PILOT AGREEMENT

Daze Technologies Corp.

This Pilot Agreement ("Agreement") is entered into between Daze Technologies Corp., a Delaware corporation with its principal place of business in Florida ("Daze"), and:

Client Legal Name: ${name}
DBA (Doing Business as): ${dba}
Address: ${addr}
Primary Contact: ${contact}
Title: ${title}
Email: ${email}

("Client") for the purpose of deploying and evaluating the Daze platform in a live operational environment. This Agreement reflects the parties' shared intent to proceed with a structured pilot as a step toward a long-term commercial relationship governed by Daze's Master Services Agreement ("MSA").

1. PILOT PURPOSE

The purpose of this pilot is to deploy the Daze platform within select Client locations to:
• Validate operational workflows and staff adoption.
• Improve guest ordering convenience and overall experience.
• Measure service efficiency, labor impact, and operational benefits.
• Evaluate revenue performance, guest adoption rates, and return on investment.

The pilot is intended as a pre-commercial implementation to demonstrate operational readiness and mutual fit, not as a proof-of-concept or technology validation exercise.

2. PILOT SCOPE

2.1 Covered Outlets
The Pilot will be conducted at the following F&B outlets and Serviceable areas:
${outletLines}

2.2 Products and Services
The Pilot may include one or more Daze products, which shall be deployed and rolled out according to a written implementation schedule agreed by both parties ("Implementation Schedule"). Rollout of additional products beyond the initial scope requires written approval from both parties and may trigger revised pilot terms.

Available products include:
• Pool & Beach Mobile Ordering
• Common Space Digital Ordering
• Table Pay & Order
• In-Room Dining

2.3 Hardware Selection
${hwNone} No Daze Hardware Required
${hwDaze} Daze-Provided Hardware

2.4 Enabled Capabilities
During the Pilot Term, Daze shall provide the following capabilities:
• Guest mobile ordering via smartphone or tablet.
• Payment processing and facilitation (Client remains merchant of record).
• Location-based delivery coordination.
• Management reporting and analytics dashboard.
• POS integration with Client's designated point-of-sale system(s).
• QR Code Access Points: Design and provision of branded QR code signage.

3. PILOT TERM

Start Date: ${startDate}
Pilot Term: ${termDays} days (recommended: 60-90 days)

The Pilot Term may be extended by mutual written agreement of both parties.

4. RESPONSIBILITIES

4.1 Daze Responsibilities
Daze shall:
• Configure and deploy the platform for Covered Outlets.
• Provide onboard training for Client staff.
• Provide operational support during business hours.
• Monitor platform performance and provide reporting.
• Integrate with Client's designated POS system(s).

4.2 Client Responsibilities
Client shall:
• Provide operational access to Covered Outlets, including Wi-Fi and power access.
• Ensure staff participation in training and day-to-day platform operation.
• Designate a primary point of contact with authority to make operational decisions.
• Provide timely feedback on platform performance and guest experience.
• Maintain PCI DSS compliance for its payment processing systems.
• Provide API credentials and technical documentation for POS integration.

4.3 Hardware & Physical Materials
If selected in Section 2.3, Daze shall provide Client with hardware and physical materials ("Hardware"). All such Hardware remains the sole property of Daze and is subject to bailment terms including standard of care, restrictions, recovery & reimbursement, and QR Code IP provisions.

5. PILOT FEES

${pNone} 5.1 No Fees — No fees apply during the Pilot Term.

${pSub} 5.2 Subscription Platform Fee — Client agrees to pay Daze a platform subscription fee of $${pAmt} for access and use of the Daze platform during the Pilot Term.

${pDaze} 5.3 Daze Revenue Share Fee — Daze shall retain a fee equal to ${pAmt}% of the gross transaction value of each completed order processed through the platform.

${pClient} 5.4 Client Revenue Share Fee — Client shall pay Daze a revenue-share fee equal to ${pAmt}% of the gross food and beverage sales value of each completed order.

5.5 Payment Terms
Any pilot fees will be invoiced by Daze and are due Net 7 from the invoice date, unless otherwise agreed in writing.

6. SETTLEMENT, TIPS, AND CHARGEBACKS

6.1 Settlement — Net food and beverage proceeds, less applicable platform fees, are remitted to Client on a Net 7 settlement basis.
6.2 Tips and Gratuities — All customer tips are pass-through funds, excluded from platform fee calculations.
6.3 Payment Disputes and Chargebacks — Client remains solely responsible for all refunds, returns, chargebacks, and payment disputes.

7. PILOT SUCCESS CHECKPOINT & CONTINUITY CLAUSE

During the Pilot Term, the parties agree to conduct a good-faith review of pilot performance (the "Pilot Success Checkpoint"), typically scheduled 14–21 days prior to the end of the Pilot Term.

8. DATA, SECURITY, AND CONFIDENTIALITY

8.1 Data Ownership — Daze retains all rights to the Daze platform; Client retains all rights to Client Data.
8.2 Data License — Client grants Daze a non-exclusive, perpetual license to use Client Data solely in aggregated and de-identified form.
8.3 Security Standards — Platform architecture is aligned with SOC 2 Trust Services Criteria.
8.4 Encryption — AES-256 at rest and TLS 1.2+ in transit.
8.5 Privacy — Daze shall not sell, rent, or share guest PII with third parties.
8.6 PCI DSS — No raw credit card data is stored on Daze-managed servers.
8.7 Incident Response — Daze will notify Client within 48 hours of a confirmed breach.
8.8 Confidentiality — Both parties agree to maintain confidentiality for 3 years from disclosure.

9. TERMINATION

Either party may terminate this Agreement upon fourteen (14) days' written notice.

10. INDEMNIFICATION

Client shall indemnify and hold harmless Daze from claims arising from Client's use of the Services, products sold, guest complaints, PCI breaches, negligence, or IP infringement.

11. LIMITATION OF LIABILITY

NEITHER PARTY'S LIABILITY SHALL EXCEED FEES PAID UNDER THIS AGREEMENT. NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.

12. SERVICE LEVEL AGREEMENT

Daze targets 99.5% platform uptime during Client's operating hours (excluding scheduled maintenance).

13. MISCELLANEOUS

13.1 Subcontractors — Daze may use third-party subcontractors (including AWS, payment processors, analytics providers).

13.2 POS Integration
POS System: ${posSystem}
Version: ${posVersion}
API Key: ${posApiKey}
Who to Contact: ${posContact}

13.3 Governing Law — State of Florida.
13.4 Dispute Resolution — Good faith negotiation, then courts in Miami-Dade County, Florida.
13.5 Entire Agreement
13.6 Amendment — Written instrument signed by both parties.
13.7 Assignment
13.8 Force Majeure
13.9 Severability
13.10 Counterparts`;
};

const HighlightedText = memo(({ text, entity }: { text: string; entity: PilotAgreementData }) => {
  const values = [
    entity.legal_entity_name?.trim(),
    entity.dba_name?.trim(),
    entity.billing_address?.trim(),
    entity.authorized_signer_name?.trim(),
    entity.authorized_signer_title?.trim(),
    entity.contact_email?.trim(),
  ].filter(Boolean) as string[];

  if (values.length === 0) return <>{text}</>;

  const escapedValues = values.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedValues.join('|')})`, 'g');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        if (values.includes(part)) {
          return <span key={i} className="text-primary font-semibold">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
});
HighlightedText.displayName = "HighlightedText";

// Collapsible form section component
function FormSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border/50 bg-secondary/30 overflow-hidden">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-secondary/60 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-xs font-semibold">{title}</span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 pt-1 space-y-2.5">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ReviewSignModal({
  open,
  onOpenChange,
  documentTitle,
  onSign,
  onDraftSave,
  isSubmitting = false,
  existingSignatureUrl,
  signedAt,
  initialLegalEntity,
}: ReviewSignModalProps) {
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [hasSignature, setHasSignature] = useState(false);

  // Section A: Client Identity
  const [propertyName, setPropertyName] = useState("");
  const [legalEntityName, setLegalEntityName] = useState("");
  const [authorizedSignerName, setAuthorizedSignerName] = useState("");
  const [authorizedSignerTitle, setAuthorizedSignerTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");

  // Section B: Pilot Scope
  const [outlet1, setOutlet1] = useState("");
  const [outlet2, setOutlet2] = useState("");
  const [outlet3, setOutlet3] = useState("");
  const [outlet4, setOutlet4] = useState("");
  const [hardwareOption, setHardwareOption] = useState<"none" | "daze_provided">("none");

  // Section C: Pilot Term
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [pilotTermDays, setPilotTermDays] = useState("90");

  // Section D: Pricing
  const [pricingModel, setPricingModel] = useState<"none" | "subscription" | "daze_rev_share" | "client_rev_share">("none");
  const [pricingAmount, setPricingAmount] = useState("");

  // Section E: POS
  const [posSystem, setPosSystem] = useState("");
  const [posVersion, setPosVersion] = useState("");
  const [posApiKey, setPosApiKey] = useState("");
  const [posContact, setPosContact] = useState("");

  const isSigned = !!existingSignatureUrl;

  const billingAddress = formatAddress({
    street: addressStreet,
    city: addressCity,
    state: addressState,
    zip: addressZip,
  });

  // Pre-fill from saved data — only when the modal OPENS (false → true)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current && initialLegalEntity) {
      const d = initialLegalEntity;
      setPropertyName(d.property_name || "");
      setLegalEntityName(d.legal_entity_name || "");
      setAuthorizedSignerName(d.authorized_signer_name || "");
      setAuthorizedSignerTitle(d.authorized_signer_title || "");
      setContactEmail(d.contact_email || "");

      const parsed = parseAddress(d.billing_address);
      setAddressStreet(parsed.street || "");
      setAddressCity(parsed.city || "");
      setAddressState(parsed.state || "");
      setAddressZip(parsed.zip || "");

      const outlets = d.covered_outlets || [];
      setOutlet1(outlets[0] || "");
      setOutlet2(outlets[1] || "");
      setOutlet3(outlets[2] || "");
      setOutlet4(outlets[3] || "");
      setHardwareOption(d.hardware_option || "none");

      if (d.start_date) {
        try { setStartDate(new Date(d.start_date)); } catch { setStartDate(undefined); }
      }
      setPilotTermDays(d.pilot_term_days != null ? String(d.pilot_term_days) : "90");

      setPricingModel(d.pricing_model || "none");
      setPricingAmount(d.pricing_amount || "");

      setPosSystem(d.pos_system || "");
      setPosVersion(d.pos_version || "");
      setPosApiKey(d.pos_api_key || "");
      setPosContact(d.pos_contact || "");
    }
    prevOpenRef.current = open;
  }, [open, initialLegalEntity]);

  const currentEntity: PilotAgreementData = useMemo(() => ({
    property_name: propertyName,
    legal_entity_name: legalEntityName,
    dba_name: propertyName, // DBA maps to property name
    billing_address: billingAddress,
    authorized_signer_name: authorizedSignerName,
    authorized_signer_title: authorizedSignerTitle,
    contact_email: contactEmail,
    covered_outlets: [outlet1, outlet2, outlet3, outlet4].filter(o => o.trim()),
    hardware_option: hardwareOption,
    start_date: startDate?.toISOString(),
    pilot_term_days: pilotTermDays ? parseInt(pilotTermDays, 10) : undefined,
    pricing_model: pricingModel,
    pricing_amount: pricingAmount,
    pos_system: posSystem,
    pos_version: posVersion,
    pos_api_key: posApiKey,
    pos_contact: posContact,
  }), [propertyName, legalEntityName, billingAddress, authorizedSignerName, authorizedSignerTitle, contactEmail, outlet1, outlet2, outlet3, outlet4, hardwareOption, startDate, pilotTermDays, pricingModel, pricingAmount, posSystem, posVersion, posApiKey, posContact]);

  // Defer agreement text rendering so typing stays instant
  const deferredEntity = useDeferredValue(currentEntity);
  const agreementText = useMemo(() => createAgreementText(deferredEntity), [deferredEntity]);

  // All fields required
  const isFormValid = useMemo(() =>
    propertyName.trim().length > 0 &&
    legalEntityName.trim().length > 0 &&
    addressStreet.trim().length > 0 &&
    addressCity.trim().length > 0 &&
    addressState.trim().length > 0 &&
    addressZip.trim().length > 0 &&
    authorizedSignerName.trim().length > 0 &&
    authorizedSignerTitle.trim().length > 0 &&
    contactEmail.trim().length > 0 &&
    [outlet1, outlet2, outlet3, outlet4].some(o => o.trim().length > 0) &&
    !!startDate,
    [propertyName, legalEntityName, addressStreet, addressCity, addressState, addressZip, authorizedSignerName, authorizedSignerTitle, contactEmail, outlet1, outlet2, outlet3, outlet4, startDate]
  );

  const handleSignatureChange = (hasSig: boolean) => setHasSignature(hasSig);

  const handleConfirmSign = () => {
    const dataUrl = signaturePadRef.current?.getDataUrl();
    if (dataUrl && isFormValid) {
      onSign(dataUrl, currentEntity);
    }
  };

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setHasSignature(false);
  };

  const handleDownload = async () => {
    await generateAgreementPdf({
      entity: isSigned && initialLegalEntity ? initialLegalEntity : currentEntity,
      signatureDataUrl: existingSignatureUrl,
      signedAt: signedAt,
    });
  };

  const formattedSignedDate = signedAt
    ? format(new Date(signedAt), "MMMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isSigned && onDraftSave) {
        // Auto-save draft when closing unsigned
        onDraftSave(currentEntity as unknown as Record<string, unknown>);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-5xl h-[100dvh] sm:h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-lg">
            {documentTitle}
            {isSigned && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-normal bg-success/10 text-success px-1.5 sm:px-2 py-0.5 rounded-full">
                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Signed
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-[10px] sm:text-sm">
            {isSigned
              ? "This agreement has been digitally signed"
              : "Complete entity info below. Details appear in the contract."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden min-h-0">
          {/* Left Panel: Form + Agreement Text */}
          <div className="border-b lg:border-b-0 lg:border-r flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                {/* Entity Information Form */}
                {!isSigned && (
                  <div className="space-y-2.5 sm:space-y-3">
                    {/* Section A: Client Identity (always open) */}
                    <FormSection title="A — Client Identity" icon={Building2} defaultOpen>
                      <div className="grid gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-[10px] sm:text-xs flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                            Legal Entity Name <span className="text-destructive">*</span>
                          </Label>
                          <Input placeholder="e.g., Hospitality Group, LLC" value={legalEntityName} onChange={e => setLegalEntityName(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] sm:text-xs flex items-center gap-1.5">
                            <Hotel className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                            DBA / Property Name <span className="text-destructive">*</span>
                          </Label>
                          <Input placeholder="e.g., The Beach Resort" value={propertyName} onChange={e => setPropertyName(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] sm:text-xs flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                            Address <span className="text-destructive">*</span>
                          </Label>
                          <Input placeholder="Street address" value={addressStreet} onChange={e => setAddressStreet(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                          <Input placeholder="City" value={addressCity} onChange={e => setAddressCity(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="State" value={addressState} onChange={e => setAddressState(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                            <Input placeholder="ZIP code" value={addressZip} onChange={e => setAddressZip(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-[10px] sm:text-xs flex items-center gap-1.5">
                              <User className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                              Primary Contact <span className="text-destructive">*</span>
                            </Label>
                            <Input placeholder="Full name" value={authorizedSignerName} onChange={e => setAuthorizedSignerName(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] sm:text-xs flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                              Title <span className="text-destructive">*</span>
                            </Label>
                            <Input placeholder="e.g., GM" value={authorizedSignerTitle} onChange={e => setAuthorizedSignerTitle(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] sm:text-xs flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input type="email" placeholder="contact@example.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                        </div>
                      </div>
                    </FormSection>

                    {/* Section B: Pilot Scope */}
                    <FormSection title="B — Pilot Scope" icon={Store}>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] sm:text-xs text-muted-foreground">Covered Outlets (at least 1 required) <span className="text-destructive">*</span></Label>
                        {[
                          { val: outlet1, set: setOutlet1 },
                          { val: outlet2, set: setOutlet2 },
                          { val: outlet3, set: setOutlet3 },
                          { val: outlet4, set: setOutlet4 },
                        ].map((o, i) => (
                          <Input key={i} placeholder={`Outlet ${i + 1}`} value={o.val} onChange={e => o.set(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                        ))}
                        <div className="pt-2 space-y-2">
                          <Label className="text-[10px] sm:text-xs text-muted-foreground">Hardware Selection</Label>
                          <RadioGroup value={hardwareOption} onValueChange={v => setHardwareOption(v as "none" | "daze_provided")} className="gap-2">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="none" id="hw-none" />
                              <Label htmlFor="hw-none" className="text-xs font-normal cursor-pointer">No Daze Hardware Required</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="daze_provided" id="hw-daze" />
                              <Label htmlFor="hw-daze" className="text-xs font-normal cursor-pointer">Daze-Provided Hardware</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </FormSection>

                    {/* Section C: Pilot Term */}
                    <FormSection title="C — Pilot Term" icon={Clock}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-[10px] sm:text-xs text-muted-foreground">Start Date <span className="text-destructive">*</span></Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full h-8 sm:h-9 justify-start text-xs sm:text-sm font-normal", !startDate && "text-muted-foreground")}>
                                <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                                {startDate ? format(startDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] sm:text-xs text-muted-foreground">Pilot Term (days)</Label>
                          <Input type="number" min="1" placeholder="90" value={pilotTermDays} onChange={e => setPilotTermDays(e.target.value)} className="h-8 sm:h-9 text-xs sm:text-sm" />
                        </div>
                      </div>
                    </FormSection>

                    {/* Section D: Pricing */}
                    <FormSection title="D — Pricing" icon={DollarSign}>
                      <RadioGroup value={pricingModel} onValueChange={v => setPricingModel(v as typeof pricingModel)} className="gap-2">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="none" id="pr-none" />
                          <Label htmlFor="pr-none" className="text-xs font-normal cursor-pointer">No Fees</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="subscription" id="pr-sub" />
                          <Label htmlFor="pr-sub" className="text-xs font-normal cursor-pointer">Subscription Fee ($)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="daze_rev_share" id="pr-daze" />
                          <Label htmlFor="pr-daze" className="text-xs font-normal cursor-pointer">Daze Revenue Share (%)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="client_rev_share" id="pr-client" />
                          <Label htmlFor="pr-client" className="text-xs font-normal cursor-pointer">Client Revenue Share (%)</Label>
                        </div>
                      </RadioGroup>
                      {pricingModel !== "none" && (
                        <div className="space-y-1 pt-1">
                          <Label className="text-[10px] text-muted-foreground">
                            {pricingModel === "subscription" ? "Amount ($)" : "Percentage (%)"}
                          </Label>
                          <Input placeholder={pricingModel === "subscription" ? "e.g., 500" : "e.g., 15"} value={pricingAmount} onChange={e => setPricingAmount(e.target.value)} className="h-8 text-xs" />
                        </div>
                      )}
                    </FormSection>

                    {/* Section E: POS Integration */}
                    <FormSection title="E — POS Integration" icon={Cpu}>
                      <div className="grid gap-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">POS System</Label>
                            <Input placeholder="e.g., Toast" value={posSystem} onChange={e => setPosSystem(e.target.value)} className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Version</Label>
                            <Input placeholder="e.g., v3.2" value={posVersion} onChange={e => setPosVersion(e.target.value)} className="h-8 text-xs" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">API Key</Label>
                          <Input placeholder="API key for integration" value={posApiKey} onChange={e => setPosApiKey(e.target.value)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Who to Contact</Label>
                          <Input placeholder="IT contact name" value={posContact} onChange={e => setPosContact(e.target.value)} className="h-8 text-xs" />
                        </div>
                      </div>
                    </FormSection>
                  </div>
                )}

                {/* Agreement Document */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Agreement</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownload}
                      className="h-6 sm:h-7 gap-1 sm:gap-1.5 text-[10px] sm:text-xs bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-medium px-2 sm:px-3"
                    >
                      <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">PDF</span>
                    </Button>
                  </div>
                  <div className="p-3 sm:p-4 bg-white dark:bg-background border rounded-lg text-xs sm:text-sm leading-relaxed max-h-[200px] sm:max-h-none overflow-y-auto">
                    {agreementText.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-wrap mb-2 sm:mb-3 last:mb-0">
                        <HighlightedText text={paragraph} entity={deferredEntity} />
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Signature */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <div className="px-3 sm:px-4 py-2 bg-muted/50 border-b shrink-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                {isSigned ? "Digital Signature" : "Your Signature"}
              </p>
            </div>
            <div className="flex-1 p-3 sm:p-6 flex flex-col min-h-0 overflow-auto">
              {isSigned ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success mb-2">
                      <Check className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-semibold text-foreground">Agreement Signed</h3>
                    <p className="text-sm text-muted-foreground">
                      This document has been digitally signed and is legally binding.
                    </p>
                  </div>

                  {initialLegalEntity && (
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
                      {initialLegalEntity.property_name && (
                        <p><span className="text-muted-foreground">Property:</span> <span className="font-medium">{initialLegalEntity.property_name}</span></p>
                      )}
                      <p><span className="text-muted-foreground">Entity:</span> <span className="font-medium">{initialLegalEntity.legal_entity_name}</span></p>
                      <p><span className="text-muted-foreground">Address:</span> <span className="font-medium">{initialLegalEntity.billing_address}</span></p>
                      <p><span className="text-muted-foreground">Signed by:</span> <span className="font-medium">{initialLegalEntity.authorized_signer_name}, {initialLegalEntity.authorized_signer_title}</span></p>
                    </div>
                  )}

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
                        <CalendarIcon className="w-3 h-3" strokeWidth={1.5} />
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
                <>
                  <div className="flex-1 flex flex-col min-h-0">
                    {!isFormValid && (
                      <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                        <p className="text-xs text-warning font-medium">
                          Complete all required fields in Section A to enable signing.
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
                      By signing, you agree to the terms on behalf of <span className="font-semibold text-foreground">{legalEntityName || "[Your Entity]"}</span>.
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

                  <div className="mt-auto pt-3 sm:pt-4 space-y-2 sm:space-y-3 border-t shrink-0">
                    <div className="flex gap-2 sm:gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClear}
                        disabled={!hasSignature || isSubmitting || !isFormValid}
                        className="flex-1 min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm"
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={handleConfirmSign}
                        disabled={!hasSignature || isSubmitting || !isFormValid}
                        className="flex-[2] gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                            Signing...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Sign
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                      Signature is securely stored and timestamped
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
