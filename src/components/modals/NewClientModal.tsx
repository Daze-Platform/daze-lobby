import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Check,
  Store,
  Link,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

const POS_PROVIDERS = [
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
  { id: "simphony_cloud", name: "SimphonyCloud", logo: "/pos-logos/micros.png" },
  { id: "other", name: "Other", logo: "" },
];
const SUGGESTED_ROLES = ["General Manager", "F&B Director", "IT Director", "Controller"] as const;

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isCustomRole: boolean;
}

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewClientModal({ open, onOpenChange }: NewClientModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [propertyName, setPropertyName] = useState("");
  const [posProvider, setPosProvider] = useState("");

  // Auto-generate slug from property name
  const generatedSlug = propertyName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const [customSlug, setCustomSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // Auto-sync slug from property name until manually edited
  useEffect(() => {
    if (!slugTouched) {
      setCustomSlug(generatedSlug);
    }
  }, [generatedSlug, slugTouched]);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customRoleInput, setCustomRoleInput] = useState("");

  const isSlugValid = customSlug.length >= 3 && /^[a-z0-9-]+$/.test(customSlug);

  const resetForm = () => {
    setStep(1);
    setPropertyName("");
    setPosProvider("");
    setCustomSlug("");
    setSlugTouched(false);
    setContacts([]);
    setCustomRoleInput("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const portalBaseUrl = `${window.location.origin}/portal/`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${portalBaseUrl}${customSlug}`);
    toast.success("Portal URL copied to clipboard");
  };

  const createClientMutation = useMutation({
    mutationFn: async () => {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: propertyName.trim(),
          phase: "onboarding",
          notes: posProvider ? `POS Provider: ${posProvider}` : null,
          client_slug: customSlug,
        })
        .select("id")
        .single();

      if (clientError) throw clientError;

      const taskKeys = [
        { key: "legal", name: "Legal Agreement" },
        { key: "brand", name: "Brand Identity" },
        { key: "venue", name: "Venue Setup" },
        { key: "pos", name: "POS Integration" },
        { key: "devices", name: "Device Setup" },
      ];

      const { error: tasksError } = await supabase
        .from("onboarding_tasks")
        .insert(
          taskKeys.map((task) => ({
            client_id: client.id,
            task_key: task.key,
            task_name: task.name,
            is_completed: false,
            data: task.key === "pos" && posProvider ? { provider: posProvider } : {},
          }))
        );

      if (tasksError) throw tasksError;

      const validContacts = contacts.filter((c) => c.firstName.trim() || c.lastName.trim() || c.email.trim() || c.phone.trim());
      
      if (validContacts.length > 0) {
        const { error: contactsError } = await supabase
          .from("client_contacts")
          .insert(
            validContacts.map((contact, index) => ({
              client_id: client.id,
              name: `${contact.firstName.trim()} ${contact.lastName.trim()}`.trim() || "Unnamed Contact",
              email: contact.email.trim() || null,
              phone: contact.phone.trim() || null,
              role: contact.role || null,
              is_primary: index === 0,
            }))
          );

        if (contactsError) throw contactsError;
      }

      return client.id;
    },
    onSuccess: async (clientId) => {
      queryClient.invalidateQueries({ queryKey: ["clients-with-details"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients-admin"] });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activity_logs").insert([{
          client_id: clientId,
          user_id: user.id,
          action: "client_created",
          details: { client_name: propertyName.trim() } as unknown as Json,
          is_auto_logged: false,
        }]);
      }
      toast.success("Client created successfully!");
      handleClose();
      navigate(`/clients?selected=${clientId}`);
    },
    onError: (error) => {
      console.error("Failed to create client:", error);
      toast.error("Failed to create client. Please try again.");
    },
  });

  const addContact = (role?: string) => {
    setContacts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: role || "",
        isCustomRole: !SUGGESTED_ROLES.includes(role as typeof SUGGESTED_ROLES[number]),
      },
    ]);
  };

  const addCustomRole = () => {
    if (customRoleInput.trim()) {
      addContact(customRoleInput.trim());
      setCustomRoleInput("");
    }
  };

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const canProceedToStep2 = propertyName.trim().length > 0 && posProvider.length > 0;
  const isSubmitting = createClientMutation.isPending;

  const usedRoles = contacts.map((c) => c.role);
  const availableRoles = SUGGESTED_ROLES.filter((r) => !usedRoles.includes(r));

  const stepIcons = {
    1: <Building2 className="w-5 h-5 text-primary" />,
    2: <Users className="w-5 h-5 text-primary" />,
    3: <Link className="w-5 h-5 text-primary" />,
  };

  const stepTitles = {
    1: "Property Identity",
    2: "Team Contacts",
    3: "Portal Access",
  };

  const stepDescriptions = {
    1: "Enter the property name and POS system",
    2: "Add contacts for this property (optional)",
    3: "Customize the portal URL for your client",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              {stepIcons[step]}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {stepTitles[step]}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {stepDescriptions[step]}
              </DialogDescription>
            </div>
          </div>
          
          {/* Step Indicator - 3 steps */}
          <div className="flex items-center gap-2 mt-4">
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors",
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {step > 1 ? <Check className="w-4 h-4" /> : "1"}
            </div>
            <div className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              step >= 2 ? "bg-primary" : "bg-muted"
            )} />
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors",
              step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {step > 2 ? <Check className="w-4 h-4" /> : "2"}
            </div>
            <div className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              step >= 3 ? "bg-primary" : "bg-muted"
            )} />
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors",
              step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              3
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="propertyName" className="text-sm font-medium">
                    Property Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="propertyName"
                    placeholder="e.g., Springhill Suites Orange Beach"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="h-11"
                    autoFocus
                  />
                </div>

                {generatedSlug && (
                  <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-1.5 rounded-md">
                    Portal URL: /portal/{generatedSlug}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="posProvider" className="text-sm font-medium">
                    POS Provider <span className="text-destructive">*</span>
                  </Label>
                  <Select value={posProvider} onValueChange={setPosProvider}>
                    <SelectTrigger id="posProvider" className="h-11">
                      {posProvider ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const selected = POS_PROVIDERS.find(p => p.name === posProvider);
                            return selected?.logo ? (
                              <img src={selected.logo} alt={selected.name} className="w-5 h-5 object-contain rounded-sm" />
                            ) : (
                              <Store className="w-5 h-5 text-muted-foreground" />
                            );
                          })()}
                          <span>{posProvider}</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select POS system" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {POS_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.id} value={provider.name}>
                          <div className="flex items-center gap-2">
                            {provider.logo ? (
                              <img src={provider.logo} alt={provider.name} className="w-5 h-5 object-contain rounded-sm" />
                            ) : (
                              <Store className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span>{provider.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This helps us configure the correct integration settings
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Quick Add Roles */}
                {availableRoles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Quick Add by Role
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {availableRoles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors py-1.5 px-3"
                          onClick={() => addContact(role)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Role Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom role..."
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomRole()}
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomRole}
                    disabled={!customRoleInput.trim()}
                    className="h-9 px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Contacts List */}
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {contacts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p>No contacts added yet</p>
                      <p className="text-xs mt-1">Contacts can be added later</p>
                    </div>
                  ) : (
                    contacts.map((contact) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-lg bg-muted/50 border border-border/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {contact.role || "No Role"}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeContact(contact.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="First name"
                            value={contact.firstName}
                            onChange={(e) => updateContact(contact.id, "firstName", e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Last name"
                            value={contact.lastName}
                            onChange={(e) => updateContact(contact.id, "lastName", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Email"
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Phone"
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Customize the portal URL that will be shared with your client for platform access.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portalSlug" className="text-sm font-medium">
                    Portal URL Slug <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-0">
                    <div className="flex items-center h-11 px-3 rounded-l-lg border border-r-0 border-border/50 bg-muted/70 text-sm text-muted-foreground font-mono whitespace-nowrap">
                      /portal/
                    </div>
                    <Input
                      id="portalSlug"
                      value={customSlug}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        setCustomSlug(val);
                        setSlugTouched(true);
                      }}
                      className="h-11 rounded-l-none font-mono"
                      placeholder="my-property"
                    />
                  </div>
                  {customSlug && !isSlugValid && (
                    <p className="text-xs text-destructive">
                      Slug must be at least 3 characters (lowercase letters, numbers, hyphens only)
                    </p>
                  )}
                </div>

                {/* Full URL preview */}
                {customSlug && isSlugValid && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Full Portal URL
                    </Label>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/40">
                      <p className="text-sm font-mono text-foreground truncate flex-1">
                        {portalBaseUrl}{customSlug}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyUrl}
                        className="h-8 px-2 shrink-0"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                {slugTouched && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="px-0 text-xs text-muted-foreground"
                    onClick={() => {
                      setSlugTouched(false);
                      setCustomSlug(generatedSlug);
                    }}
                  >
                    Reset to auto-generated slug
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border/40 flex items-center justify-between">
          {step === 1 && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="ghost" onClick={() => setStep(2)} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => createClientMutation.mutate()}
                disabled={isSubmitting || !isSlugValid}
                className="gap-2 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Client
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
