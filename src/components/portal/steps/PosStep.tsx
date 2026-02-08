import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepCompletionEffect } from "../StepCompletionEffect";
import { StepBadge, type StepBadgeStatus } from "@/components/ui/step-badge";
import { 
  ArrowLeft,
  Copy, 
  Check,
  Cpu,
  Utensils,
  Tablet,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { useLogActivity } from "@/hooks/useLogActivity";
import { useClient } from "@/contexts/ClientContext";

type PosProvider = "toast" | "micros" | "ncr" | "lavu" | null;

interface PosStepProps {
  isCompleted: boolean;
  isLocked: boolean;
  isActive?: boolean;
  data?: Record<string, unknown>;
  onUpdate: (data: { provider: string; status: string }) => void;
  isSaving?: boolean;
  onStepComplete?: () => void;
  isJustCompleted?: boolean;
  isUnlocking?: boolean;
}

const PROVIDERS = [
  {
    id: "toast" as const,
    name: "Toast",
    icon: Utensils,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "micros" as const,
    name: "Oracle MICROS",
    icon: Cpu,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "ncr" as const,
    name: "NCR Aloha",
    icon: Tablet,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "lavu" as const,
    name: "Lavu",
    icon: Smartphone,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
];

const PROVIDER_INSTRUCTIONS: Record<Exclude<PosProvider, null>, {
  headline: string;
  steps: string[];
  copyText: string;
}> = {
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
  micros: {
    headline: "Next Steps for Oracle MICROS",
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
  ncr: {
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
  lavu: {
    headline: "Next Steps for Lavu",
    steps: [
      "1. Log into the Lavu Control Panel as Admin",
      "2. Navigate to Settings > API Access",
      "3. Generate a new API Key for Daze",
      "4. Copy the API Key and Location ID",
    ],
    copyText: `LAVU POS INTEGRATION REQUEST

IT Team,

Please configure Lavu API access for Daze integration:

Required Configuration:
• Login to Lavu Control Panel (admin access)
• Navigate to Settings > Integrations > API
• Generate new API Key (label: "Daze Integration")
• Note the Location ID

Credentials needed:
• Lavu API Key
• Location ID
• Account Email

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
  
  const [selectedProvider, setSelectedProvider] = useState<PosProvider>(savedProvider || null);
  const [showInstructions, setShowInstructions] = useState(!!savedProvider);
  const [copied, setCopied] = useState(false);
  const [isPendingIT, setIsPendingIT] = useState(savedStatus === "pending_it");

  // Derive badge status
  const badgeStatus: StepBadgeStatus = isCompleted
    ? "complete"
    : isPendingIT
      ? "active"
      : isLocked
        ? "locked"
        : "pending";

  const handleProviderSelect = (providerId: PosProvider) => {
    setSelectedProvider(providerId);
    
    // Log activity
    if (providerId) {
      logActivity.mutate({
        action: "pos_provider_selected",
        details: {
          provider: providerId,
        },
      });
    }
    
    // Animate to instructions after a brief delay
    setTimeout(() => {
      setShowInstructions(true);
    }, 200);
  };

  const handleBack = () => {
    setShowInstructions(false);
    setTimeout(() => {
      setSelectedProvider(null);
    }, 300);
  };

  const handleCopyInstructions = async () => {
    if (!selectedProvider) return;
    
    const instructions = PROVIDER_INSTRUCTIONS[selectedProvider];
    await navigator.clipboard.writeText(instructions.copyText);
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
      status: "pending_it" 
    });
    
    // Log activity
    logActivity.mutate({
      action: "pos_sent_to_it",
      details: {
        provider: selectedProvider,
      },
    });
    
    toast.success("Marked as Pending IT Verification", {
      description: "We'll follow up when credentials are received",
    });
  };

  const providerInfo = selectedProvider ? PROVIDERS.find(p => p.id === selectedProvider) : null;
  const instructions = selectedProvider ? PROVIDER_INSTRUCTIONS[selectedProvider] : null;

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
              {isPendingIT && !isCompleted && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-2xs font-medium bg-primary/10 text-primary">
                  Pending IT
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
        <div className="relative min-h-[260px] sm:min-h-[280px] pt-1 sm:pt-2">
          <AnimatePresence mode="wait">
            {!showInstructions ? (
              /* Provider Selection Grid */
              <motion.div
                key="grid"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="space-y-2 sm:space-y-3"
              >
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  Select your POS provider to get integration instructions:
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {PROVIDERS.map((provider) => {
                    const Icon = provider.icon;
                    const isSelected = selectedProvider === provider.id;
                    
                    return (
                      <motion.button
                        key={provider.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleProviderSelect(provider.id)}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-6 rounded-xl",
                          "bg-card border-2 transition-all duration-200",
                          "hover:shadow-soft-md hover:-translate-y-0.5",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                          isSelected 
                            ? "border-primary scale-95 shadow-soft-md" 
                            : "border-transparent"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
                          provider.bgColor
                        )}>
                          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", provider.color)} strokeWidth={1.5} />
                        </div>
                        <span className="font-medium text-xs sm:text-sm text-center">{provider.name}</span>
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <motion.div
                            layoutId="provider-selection"
                            className="absolute inset-0 rounded-xl border-2 border-primary"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
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
                  {providerInfo && (
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      providerInfo.bgColor
                    )}>
                      <providerInfo.icon className={cn("w-5 h-5", providerInfo.color)} strokeWidth={1.5} />
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
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-xl overflow-x-auto max-h-[160px] overflow-y-auto">
                    <code>{instructions?.copyText}</code>
                  </pre>
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
                      disabled={isSaving}
                      className="flex-1 rounded-full min-h-[44px]"
                    >
                      Mark as Sent to IT
                    </Button>
                  )}
                </div>

                {/* Pending IT state */}
                {isPendingIT && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm text-primary font-medium">
                      Pending IT Verification
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
