import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { StepBadge, type StepBadgeStatus } from "@/components/ui/step-badge";
import { 
  ArrowLeft,
  Copy, 
  Check,
  Store,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useLogActivity } from "@/hooks/useLogActivity";
import { useClient } from "@/contexts/ClientContext";

type PosProvider = 
  | "toast" 
  | "ncr_aloha" 
  | "par_brink" 
  | "dinerware" 
  | "micros_simphony" 
  | "micros_3700" 
  | "positouch" 
  | "squirrel_systems" 
  | "xpient" 
  | "maitred" 
  | "ncr_cloud_connect" 
  | "simphony_fe" 
  | "simphonycloud" 
  | "other"
  | null;

const PROVIDERS: { id: Exclude<PosProvider, null>; name: string; logo: string }[] = [
  { id: "toast", name: "Toast", logo: "/pos-logos/toast.jpg" },
  { id: "ncr_aloha", name: "NCR Aloha", logo: "/pos-logos/ncr-aloha.png" },
  { id: "par_brink", name: "PAR Brink", logo: "/pos-logos/par-brink.png" },
  { id: "dinerware", name: "Dinerware", logo: "/pos-logos/dinerware.png" },
  { id: "micros_simphony", name: "Micros Simphony", logo: "/pos-logos/micros.png" },
  { id: "micros_3700", name: "Micros 3700", logo: "/pos-logos/micros.png" },
  { id: "positouch", name: "POSitouch", logo: "/pos-logos/positouch.png" },
  { id: "squirrel_systems", name: "Squirrel Systems", logo: "/pos-logos/squirrel-systems.webp" },
  { id: "xpient", name: "XPIENT", logo: "/pos-logos/xpient.webp" },
  { id: "maitred", name: "Maitre'D", logo: "/pos-logos/maitred.png" },
  { id: "ncr_cloud_connect", name: "NCR Cloud Connect", logo: "/pos-logos/ncr-cloud-connect.png" },
  { id: "simphony_fe", name: "Simphony FE", logo: "/pos-logos/micros.png" },
  { id: "simphonycloud", name: "SimphonyCloud", logo: "/pos-logos/micros.png" },
  { id: "other", name: "Other", logo: "" },
];

interface PosStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  isActive?: boolean;
  data?: Record<string, unknown>;
  onUpdate: (data: { provider: string; status: string; pms_name?: string }, markCompleted?: boolean) => void;
  isSaving?: boolean;
  onStepComplete?: () => void;
  isJustCompleted?: boolean;
  isUnlocking?: boolean;
}

const DEFAULT_INSTRUCTIONS = {
  headline: "Next Steps for Integration",
  steps: [
    "1. Contact your POS vendor's support team",
    "2. Request API access for third-party integration",
    "3. Obtain the necessary credentials (API key, store ID, etc.)",
    "4. Share the credentials securely with Daze support",
  ],
  copyText: `POS INTEGRATION REQUEST

Hi,

We are integrating with Daze for our F&B ordering system and need API access configured.

Required Items:
• API credentials for third-party integration
• Store/Location ID
• Menu API access
• Order API access

Please provide credentials at your earliest convenience.

Thank you!`,
};

const PROVIDER_INSTRUCTIONS: Partial<Record<Exclude<PosProvider, null>, {
  headline: string;
  steps: string[];
  copyText: string;
}>> = {
  toast: {
    headline: "Next Steps for Toast",
    steps: [
      "1. Contact your Toast Account Representative",
      "2. Request API Token access for third-party integration",
      "3. Ask for the Restaurant GUID and API credentials",
      "4. Share the credentials securely with Daze support",
    ],
    copyText: `TOAST POS INTEGRATION REQUEST

Hi [Toast Rep Name],

We are integrating with Daze for our F&B ordering system and need API access configured.

Required Items:
• Restaurant GUID
• API Token for third-party integration
• Menu API read access
• Order API write access

Please provide credentials at your earliest convenience.

Thank you!`,
  },
  micros_simphony: {
    headline: "Next Steps for Micros Simphony",
    steps: [
      "1. Access Oracle Hospitality Integration Platform (OHIP)",
      "2. Navigate to Simphony Web Services (SWS) configuration",
      "3. Create a new external application integration",
      "4. Generate and export the service credentials",
    ],
    copyText: `MICROS SIMPHONY INTEGRATION REQUEST

IT Team,

Please configure Simphony Web Services (SWS) for Daze integration:

Required Configuration:
• Create External Application in OHIP Portal
• Enable SWS API access
• Configure Menu sync endpoints
• Set up Order posting service account

Credentials needed:
• Organization short name
• Enterprise/Property IDs
• SWS Username & Password
• API Gateway URL

Submit credentials via secure channel.`,
  },
  ncr_aloha: {
    headline: "Next Steps for NCR Aloha",
    steps: [
      "1. Log into Aloha Configuration Center (CFC)",
      "2. Navigate to Third-Party Integrations section",
      "3. Create new integration credentials for Daze",
      "4. Export the Site ID and API key pair",
    ],
    copyText: `NCR ALOHA INTEGRATION REQUEST

IT Team,

Please configure Aloha CFC for Daze integration:

Required Configuration:
• Access Aloha Configuration Center (CFC)
• Navigate to Integrations > Third Party
• Create new integration profile: "Daze Ordering"
• Enable Menu sync and Order posting

Credentials needed:
• Site ID / Store Number
• CFC API Key
• Integration Username & Password
• Aloha Takeout Endpoint URL

Submit credentials via secure channel.`,
  },
};

export function PosStep({
  isCompleted,
  isLocked,
  data,
  onUpdate,
  isSaving,
  onStepComplete,
  isJustCompleted,
  isUnlocking
}: PosStepProps) {
  const { clientId } = useClient();
  const logActivity = useLogActivity(clientId);
  
  const savedProvider = data?.provider as PosProvider | undefined;
  const savedStatus = data?.status as string | undefined;
  const savedPmsName = data?.pms_name as string | undefined;
  
  const [selectedProvider, setSelectedProvider] = useState<PosProvider>(savedProvider || null);
  const [pmsName, setPmsName] = useState(savedPmsName || "");
  const [showInstructions, setShowInstructions] = useState(!!savedProvider);
  const [copied, setCopied] = useState(false);
  const [isPendingIT, setIsPendingIT] = useState(savedStatus === "pending_it");
  const [isITVerified, setIsITVerified] = useState(savedStatus === "it_verified");

  // Derive badge status
  const badgeStatus: StepBadgeStatus = isCompleted
    ? "complete"
    : isPendingIT
      ? "active"
      : isLocked
        ? "locked"
        : "pending";

  // Debounce PMS name auto-save
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Skip the initial render to avoid saving on mount
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (!selectedProvider) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({
        provider: selectedProvider,
        status: isPendingIT ? "pending_it" : isITVerified ? "it_verified" : "selected",
        pms_name: pmsName.trim() || undefined,
      });
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [pmsName]);

  const handleProviderSelect = (providerId: PosProvider) => {
    setSelectedProvider(providerId);
    setPmsName(""); // Clear stale PMS name when switching providers

    // Persist immediately — clear old pms_name
    if (providerId) {
      onUpdate({ provider: providerId, status: "selected", pms_name: "" });

      logActivity.mutate({
        action: "pos_provider_selected",
        details: { provider: providerId },
      });
    }

    // Animate to instructions after a brief delay
    setTimeout(() => {
      setShowInstructions(true);
    }, 200);
  };

  const handleBack = () => {
    // Persist cleared state to database
    onUpdate({ provider: "", status: "", pms_name: "" });
    
    setShowInstructions(false);
    setTimeout(() => {
      setSelectedProvider(null);
      setPmsName("");
    }, 300);
  };

  const handleCopyInstructions = async () => {
    if (!selectedProvider) return;
    
    const providerInstr = PROVIDER_INSTRUCTIONS[selectedProvider];
    const fallback = {
      ...DEFAULT_INSTRUCTIONS,
      headline: `Next Steps for ${PROVIDERS.find(p => p.id === selectedProvider)?.name || "Integration"}`,
    };
    const instr = providerInstr || fallback;
    await navigator.clipboard.writeText(instr.copyText);
    setCopied(true);
    
    // Log activity
    logActivity.mutate({
      action: "pos_instructions_copied",
      details: {
        provider: selectedProvider,
      },
    });
    
    toast.success("Copied to clipboard!", {
      description: "Instructions ready to send to your IT team",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSentToIT = () => {
    if (!selectedProvider) return;
    
    setIsPendingIT(true);
    onUpdate({ 
      provider: selectedProvider, 
      status: "pending_it",
      pms_name: pmsName.trim() || undefined,
    }, true);
    
    // Log activity
    logActivity.mutate({
      action: "pos_sent_to_it",
      details: {
        provider: selectedProvider,
        pms_name: pmsName.trim() || undefined,
      },
    });
    
    toast.success("Marked as Pending IT Verification", {
      description: "We'll follow up when credentials are received",
    });

    // Collapse and advance to the next step (Device Setup)
    if (onStepComplete) {
      onStepComplete();
    }
  };

  const handleITVerified = () => {
    if (!selectedProvider) return;

    setIsITVerified(true);

    onUpdate({
      provider: selectedProvider,
      status: "it_verified",
      pms_name: pmsName.trim() || undefined,
    }, true);

    logActivity.mutate({
      action: "pos_it_verified",
      details: { provider: selectedProvider },
    });

    toast.success("IT Verification confirmed!", {
      description: "POS integration credentials received",
    });
  };

  const providerInfo = selectedProvider ? PROVIDERS.find(p => p.id === selectedProvider) : null;
  const instructions = selectedProvider 
    ? (PROVIDER_INSTRUCTIONS[selectedProvider] || { 
        ...DEFAULT_INSTRUCTIONS, 
        headline: `Next Steps for ${providerInfo?.name || "Integration"}` 
      }) 
    : null;

  return (
    <AccordionItem
      value="pos"
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
            step="D"
            status={badgeStatus}
            isJustCompleted={isJustCompleted}
          />
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-xs sm:text-sm md:text-base truncate">POS Integration</p>
              {isPendingIT && !isITVerified && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-2xs font-medium bg-primary/10 text-primary">
                  Pending IT
                </span>
              )}
              {isITVerified && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-2xs font-medium bg-emerald-500/10 text-emerald-600">
                  IT Verified
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">
              Connect your point-of-sale system
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3 sm:pb-4">
        <div className="relative min-h-[200px] sm:min-h-[220px] pt-1 sm:pt-2">
          <AnimatePresence mode="wait">
            {!showInstructions ? (
              /* Provider Selection Dropdown */
              <motion.div
                key="dropdown"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="space-y-3 sm:space-y-4"
              >
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Select your POS provider to get integration instructions:
                </p>
                <Select 
                  value={selectedProvider || ""} 
                  onValueChange={(value) => handleProviderSelect(value as PosProvider)}
                >
                  <SelectTrigger className="h-12 text-left bg-background">
                    <SelectValue placeholder="Select your POS provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-3">
                          {provider.logo ? (
                            <img 
                              src={provider.logo} 
                              alt={provider.name} 
                              className="w-6 h-6 object-contain rounded-sm"
                              onError={(e) => {
                                const img = e.currentTarget;
                                img.style.display = 'none';
                                const fallback = img.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = 'block';
                              }} 
                            />
                          ) : null}
                          <Store 
                            className={`w-6 h-6 text-muted-foreground ${provider.logo ? 'hidden' : 'block'}`} 
                          />
                          <span className="font-medium">{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
              </motion.div>
            ) : (
              /* Instructions Panel */
              <motion.div
                key="instructions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="space-y-4"
              >
                {/* Back button */}
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change provider
                </button>

                {/* Header */}
                <div className="flex items-center gap-3">
                  {providerInfo?.logo ? (
                    <div className="w-12 h-12 rounded-lg bg-white border border-border/50 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                      <img 
                        src={providerInfo.logo} 
                        alt={`${providerInfo.name} logo`}
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <h3 className="font-semibold text-lg">{instructions?.headline}</h3>
                </div>

                {/* Steps list */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  {instructions?.steps.map((step, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      {step}
                    </p>
                  ))}
                </div>

                {/* Code block preview */}
                <div className="relative group">
                  <button
                    onClick={handleCopyInstructions}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-muted-foreground/10 hover:bg-muted-foreground/20 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Copy instructions"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <pre className="bg-muted text-muted-foreground text-xs p-4 rounded-xl overflow-x-auto max-h-[320px] overflow-y-auto border">
                    <code>{instructions?.copyText}</code>
                  </pre>
                </div>

                {/* PMS Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="pms-name" className="text-xs sm:text-sm text-muted-foreground">
                    What is the name of your Property Management System (PMS)? <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pms-name"
                    value={pmsName}
                    onChange={(e) => setPmsName(e.target.value)}
                    placeholder="e.g., Opera, Mews, Cloudbeds..."
                    className="h-12 bg-background"
                    maxLength={100}
                    required
                  />
                  {pmsName.trim().length === 0 && (
                    <p className="text-xs text-muted-foreground">Required to proceed</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleCopyInstructions}
                    className={cn(
                      "flex-1 rounded-full min-h-[44px] transition-all",
                      "bg-accent-orange hover:bg-accent-orange/90 text-white"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Instructions for IT
                      </>
                    )}
                  </Button>
                  
                  {!isPendingIT && (
                    <Button
                      variant="outline"
                      onClick={handleSentToIT}
                      disabled={isSaving || !pmsName.trim()}
                      className="flex-1 rounded-full min-h-[44px]"
                    >
                      Mark as Sent to IT
                    </Button>
                  )}
                </div>

                {/* Pending IT state */}
                {isPendingIT && !isITVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm text-primary font-medium">
                        Pending IT Verification
                      </span>
                    </div>
                    <Button
                      onClick={handleITVerified}
                      disabled={isSaving}
                      className="w-full rounded-full min-h-[44px] gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      IT Verification Completed
                    </Button>
                  </motion.div>
                )}

                {/* IT Verified state */}
                {isITVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600 font-medium">
                      IT Verification Confirmed
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
