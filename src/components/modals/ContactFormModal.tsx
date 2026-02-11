import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type ClientContact = Tables<"client_contacts">;

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  contact?: ClientContact | null;
}

export function ContactFormModal({
  open,
  onOpenChange,
  clientId,
  contact,
}: ContactFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!contact;

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setName(contact?.name ?? "");
      setRole(contact?.role ?? "");
      setEmail(contact?.email ?? "");
      setPhone(contact?.phone ?? "");
      setIsPrimary(contact?.is_primary ?? false);
      setTouched(false);
    }
  }, [open, contact]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["client-contacts", clientId] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        client_id: clientId,
        name: name.trim(),
        role: role.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
        is_primary: isPrimary,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("client_contacts")
          .update(payload)
          .eq("id", contact!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("client_contacts")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Contact updated" : "Contact added");
      invalidate();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save contact");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("client_contacts")
        .delete()
        .eq("id", contact!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`"${contact!.name}" removed`);
      invalidate();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete contact");
    },
  });

  const nameError = touched && !name.trim();
  const emailError = touched && !email.trim();
  const canSave = name.trim().length > 0 && email.trim().length > 0;
  const isBusy = saveMutation.isPending || deleteMutation.isPending;

  const handleSave = () => {
    setTouched(true);
    if (canSave) saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contact" : "New Contact"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this contact's information."
              : "Add a new contact for this client."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact-name"
              placeholder="e.g. John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && (
              <p className="text-xs text-destructive">This field is required.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-role">Role</Label>
            <Input
              id="contact-role"
              placeholder="e.g. General Manager"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="john@hotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && (
                <p className="text-xs text-destructive">This field is required.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="+1 555-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Primary Contact</p>
              <p className="text-xs text-muted-foreground">
                Displayed as the main point of contact
              </p>
            </div>
            <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          {isEditing ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                  disabled={isBusy}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove contact?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{contact?.name}" will be permanently removed from this client.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isBusy}>
              {isBusy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isBusy ? "Saving..." : isEditing ? "Save" : "Add Contact"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
