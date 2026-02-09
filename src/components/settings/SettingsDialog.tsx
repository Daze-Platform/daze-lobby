import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  ShieldCheck, 
  Palette, 
  Bell, 
  Camera, 
  Key,
  CircleNotch,
  CheckCircle,
  Warning,
  Database,
  ArrowsClockwise,
  Trash
} from "@phosphor-icons/react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePurgeAndReseed } from "@/hooks/usePurgeAndReseed";
import { isTestEnvironment } from "@/lib/environment";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  dark_mode: boolean;
  two_factor_enabled: boolean;
  alert_new_property: boolean;
  alert_agreement_signed: boolean;
  alert_device_offline: boolean;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user, role } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const { purgeAndReseed, isPurging } = usePurgeAndReseed();
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    avatar_url: null,
    dark_mode: false,
    two_factor_enabled: false,
    alert_new_property: true,
    alert_agreement_signed: true,
    alert_device_offline: true,
  });
  
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const isAdmin = role === "admin";
  const isTest = isTestEnvironment();

  // Fetch profile data
  useEffect(() => {
    if (open && user?.id) {
      fetchProfile();
    }
  }, [open, user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, dark_mode, two_factor_enabled, alert_new_property, alert_agreement_signed, alert_device_offline")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          avatar_url: data.avatar_url,
          dark_mode: data.dark_mode ?? false,
          two_factor_enabled: data.two_factor_enabled ?? false,
          alert_new_property: data.alert_new_property ?? true,
          alert_agreement_signed: data.alert_agreement_signed ?? true,
          alert_device_offline: data.alert_device_offline ?? true,
        });
        
        // Sync dark mode with theme
        if (data.dark_mode) {
          setTheme("dark");
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          dark_mode: profile.dark_mode,
          two_factor_enabled: profile.two_factor_enabled,
          alert_new_property: profile.alert_new_property,
          alert_agreement_signed: profile.alert_agreement_signed,
          alert_device_offline: profile.alert_device_offline,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Profile picture updated");
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast.error("Failed to upload profile picture");
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setShowPasswordForm(false);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      console.error("Failed to update password:", error);
      toast.error("Failed to update password");
    }
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setProfile(prev => ({ ...prev, dark_mode: checked }));
    setTheme(checked ? "dark" : "light");
  };

  const handlePurgeAndReseed = async () => {
    setShowPurgeConfirm(false);
    await purgeAndReseed();
  };

  const formatRole = (role: string | null) => {
    if (role === "admin") return "Founder/Admin";
    if (!role) return "Team Member";
    return role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const getInitials = (name: string | null, email: string | undefined) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-0 shadow-soft-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="font-display text-xl">Settings</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <CircleNotch size={32} weight="regular" className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {/* Account Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <User size={16} weight="duotone" className="text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Account</h3>
                </div>
                
                <div className="rounded-xl bg-muted/30 p-4 space-y-4">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <Avatar className="h-16 w-16 border-2 border-background shadow-soft-lg">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(profile.full_name, user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera size={20} weight="duotone" className="text-white" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile.full_name || user?.email}</p>
                      <Badge variant="secondary" className="mt-1 text-2xs">
                        {formatRole(role)}
                      </Badge>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-medium">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile.full_name || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="bg-background/80"
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted/50 text-muted-foreground"
                    />
                  </div>
                </div>
              </section>

              <Separator className="bg-border/50" />

              {/* Security Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} weight="duotone" className="text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Security</h3>
                </div>
                
                <div className="rounded-xl bg-muted/30 p-4 space-y-4">
                  {/* Update Password */}
                  {!showPasswordForm ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => setShowPasswordForm(true)}
                    >
                      <Key size={16} weight="duotone" />
                      Update Password
                    </Button>
                  ) : (
                    <div className="space-y-3 p-3 rounded-lg bg-background/50">
                      <div className="space-y-2">
                        <Label className="text-xs">New Password</Label>
                        <Input
                          type="password"
                          value={passwords.new}
                          onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Confirm Password</Label>
                        <Input
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handlePasswordUpdate}>
                          Save Password
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswords({ current: "", new: "", confirm: "" });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 2FA Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={profile.two_factor_enabled}
                      onCheckedChange={(checked) => setProfile(prev => ({ ...prev, two_factor_enabled: checked }))}
                    />
                  </div>
                </div>
              </section>

              <Separator className="bg-border/50" />

              {/* Appearance & Alerts Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette size={16} weight="duotone" className="text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Appearance & Alerts</h3>
                </div>
                
                <div className="rounded-xl bg-muted/30 p-4 space-y-4">
                  {/* Dark Mode */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">Switch to dark theme</p>
                    </div>
                    <Switch
                      checked={theme === "dark" || profile.dark_mode}
                      onCheckedChange={handleDarkModeToggle}
                    />
                  </div>

                  <Separator className="bg-border/30" />

                  {/* Email Alerts */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Bell size={14} weight="duotone" className="text-muted-foreground" />
                      <Label className="text-xs font-medium text-muted-foreground">Email Alerts</Label>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="alertNewProperty"
                          checked={profile.alert_new_property}
                          onCheckedChange={(checked) => 
                            setProfile(prev => ({ ...prev, alert_new_property: checked === true }))
                          }
                        />
                        <Label htmlFor="alertNewProperty" className="text-sm font-normal cursor-pointer">
                          New Property Added
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="alertAgreement"
                          checked={profile.alert_agreement_signed}
                          onCheckedChange={(checked) => 
                            setProfile(prev => ({ ...prev, alert_agreement_signed: checked === true }))
                          }
                        />
                        <Label htmlFor="alertAgreement" className="text-sm font-normal cursor-pointer">
                          Agreement Signed
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="alertDevice"
                          checked={profile.alert_device_offline}
                          onCheckedChange={(checked) => 
                            setProfile(prev => ({ ...prev, alert_device_offline: checked === true }))
                          }
                        />
                        <Label htmlFor="alertDevice" className="text-sm font-normal cursor-pointer">
                          Device Offline Alert
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Management (Test Only) */}
              {isTest && isAdmin && (
                <>
                  <Separator className="bg-border/50" />
                  
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Database size={16} weight="duotone" className="text-warning" />
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Data Management</h3>
                      <Badge variant="outline" className="text-2xs bg-warning/10 text-warning border-warning/20">
                        Test Only
                      </Badge>
                    </div>
                    
                    <div className="rounded-xl bg-warning/5 border border-warning/20 p-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Reset the database with fresh demo data.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => setShowPurgeConfirm(true)}
                        disabled={isPurging}
                      >
                        {isPurging ? (
                          <>
                            <ArrowsClockwise size={16} weight="regular" className="animate-spin" />
                            Reseeding...
                          </>
                        ) : (
                          <>
                            <Trash size={16} weight="duotone" />
                            Purge & Reseed Data
                          </>
                        )}
                      </Button>
                    </div>
                  </section>
                </>
              )}

              {/* Save Button */}
              <Button 
                className="w-full gap-2" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <CircleNotch size={16} weight="regular" className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} weight="duotone" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purge Confirmation Dialog */}
      <AlertDialog open={showPurgeConfirm} onOpenChange={setShowPurgeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning size={20} weight="duotone" className="text-destructive" />
              Confirm Purge & Reseed
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Delete ALL hotels and their associated data</li>
                <li>Remove all contacts, devices, and alerts</li>
                <li>Generate 10 new demo hotels across all phases</li>
              </ul>
              <p className="font-medium text-foreground pt-2">
                This cannot be undone. Continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurgeAndReseed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Purge & Reseed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}