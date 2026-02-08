import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const POS_PROVIDERS = ["Micros", "Toast", "NCR", "Lavu", "Other"] as const;
const SUGGESTED_ROLES = ["General Manager", "F&B Director", "IT Director", "Controller"] as const;

interface Contact {
  id: string;
  name: string;
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
  
  const [step, setStep] = useState<1 | 2>(1);
  const [propertyName, setPropertyName] = useState("");
  const [posProvider, setPosProvider] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customRoleInput, setCustomRoleInput] = useState("");

  const resetForm = () => {
    setStep(1);
    setPropertyName("");
    setPosProvider("");
    setContacts([]);
    setCustomRoleInput("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const createClientMutation = useMutation({
    mutationFn: async () => {
      // 1. Create the client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: propertyName.trim(),
          phase: "onboarding",
          notes: posProvider ? `POS Provider: ${posProvider}` : null,
        })
        .select("id")
        .single();

      if (clientError) throw clientError;

      // 2. Create onboarding tasks for the new client
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

      // 3. Insert contacts if any
      const validContacts = contacts.filter((c) => c.name.trim() || c.email.trim() || c.phone.trim());
      
      if (validContacts.length > 0) {
        const { error: contactsError } = await supabase
          .from("client_contacts")
          .insert(
            validContacts.map((contact, index) => ({
              client_id: client.id,
              name: contact.name.trim() || "Unnamed Contact",
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
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: ["clients-with-details"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients-admin"] });
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
        name: "",
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              {step === 1 ? (
                <Building2 className="w-5 h-5 text-primary" />
              ) : (
                <Users className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {step === 1 ? "Property Identity" : "Team Contacts"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {step === 1
                  ? "Enter the property name and POS system"
                  : "Add contacts for this property (optional)"}
              </DialogDescription>
            </div>
          </div>
          
          {/* Step Indicator */}
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
              2
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            {step === 1 ? (
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

                <div className="space-y-2">
                  <Label htmlFor="posProvider" className="text-sm font-medium">
                    POS Provider <span className="text-destructive">*</span>
                  </Label>
                  <Select value={posProvider} onValueChange={setPosProvider}>
                    <SelectTrigger id="posProvider" className="h-11">
                      <SelectValue placeholder="Select POS system" />
                    </SelectTrigger>
                    <SelectContent>
                      {POS_PROVIDERS.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This helps us configure the correct integration settings
                  </p>
                </div>
              </motion.div>
            ) : (
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
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Name"
                            value={contact.name}
                            onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                            className="h-8 text-sm"
                          />
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
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border/40 flex items-center justify-between">
          {step === 1 ? (
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
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => createClientMutation.mutate()}
                disabled={isSubmitting}
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
