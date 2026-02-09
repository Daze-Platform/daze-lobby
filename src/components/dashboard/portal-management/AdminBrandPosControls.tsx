import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Image, Loader2, X, FileText, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminBrandPosControlsProps {
  clientId: string;
  currentLogoUrl?: string | null;
  currentBrandPalette?: string[] | null;
  currentPosInstructions?: string | null;
}

export function AdminBrandPosControls({
  clientId,
  currentLogoUrl,
  currentBrandPalette,
  currentPosInstructions,
}: AdminBrandPosControlsProps) {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  
  const [posInstructions, setPosInstructions] = useState(currentPosInstructions || "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl || null);

  // Sync state when props change
  useEffect(() => {
    
    setPosInstructions(currentPosInstructions || "");
    setLogoPreview(currentLogoUrl || null);
  }, [currentBrandPalette, currentPosInstructions, currentLogoUrl]);

  

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploadingLogo(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `admin-logo-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `brands/${clientId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(filePath);

      // Update client record
      const { error: dbError } = await supabase
        .from("clients")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", clientId);

      if (dbError) throw dbError;

      return urlData.publicUrl;
    },
    onSuccess: (url) => {
      setLogoPreview(url);
      queryClient.invalidateQueries({ queryKey: ["clients-with-details"] });
      toast.success("Logo uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload logo: ${error.message}`);
    },
    onSettled: () => {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    },
  });

  const savePosInstructionsMutation = useMutation({
    mutationFn: async (instructions: string) => {
      // Find or create the POS onboarding task
      const { data: task, error: fetchError } = await supabase
        .from("onboarding_tasks")
        .select("id, data")
        .eq("client_id", clientId)
        .eq("task_key", "pos")
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (task) {
        const existingData = task.data as Record<string, unknown> || {};
        const { error } = await supabase
          .from("onboarding_tasks")
          .update({
            data: {
              ...existingData,
              admin_instructions: instructions,
            },
          })
          .eq("id", task.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks", clientId] });
      toast.success("POS instructions saved");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };

  const removeLogo = async () => {
    const { error } = await supabase
      .from("clients")
      .update({ logo_url: null })
      .eq("id", clientId);

    if (error) {
      toast.error("Failed to remove logo");
      return;
    }

    setLogoPreview(null);
    queryClient.invalidateQueries({ queryKey: ["clients-with-details"] });
    toast.success("Logo removed");
  };

  return (
    <div className="space-y-4">
      {/* Logo Upload */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            Client Logo
          </CardTitle>
          <CardDescription className="text-xs">
            Upload a logo to display on the client's portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={logoInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleLogoSelect}
          />
          
          {logoPreview ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="w-16 h-16 rounded-lg bg-white border border-border overflow-hidden flex items-center justify-center">
                <img
                  src={logoPreview}
                  alt="Client logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1" />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeLogo}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className={cn(
                "w-full h-20 border-dashed",
                isUploadingLogo && "pointer-events-none"
              )}
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload logo</span>
                </div>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Primary Brand Color */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Primary Brand Color
          </CardTitle>
          <CardDescription className="text-xs">
            Set the primary color for the client's portal theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="w-12 h-12 rounded-lg ring-2 ring-border hover:ring-primary transition-all overflow-hidden"
                style={{ backgroundColor: primaryColor }}
                onClick={() => document.getElementById(`color-picker-${clientId}`)?.click()}
              />
              <input
                id={`color-picker-${clientId}`}
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <Input
              value={primaryColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                  setPrimaryColor(e.target.value);
                }
              }}
              className="w-28 font-mono uppercase text-sm"
              placeholder="#3B82F6"
            />
            <Button
              size="sm"
              onClick={() => updateBrandMutation.mutate({ color: primaryColor })}
              disabled={updateBrandMutation.isPending}
            >
              {updateBrandMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* POS Instructions */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Internal POS Instructions
          </CardTitle>
          <CardDescription className="text-xs">
            These instructions will appear in the client's POS setup tab
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={posInstructions}
            onChange={(e) => setPosInstructions(e.target.value)}
            placeholder="Enter specific POS integration instructions for this client..."
            className="min-h-[100px] text-sm"
          />
          <Button
            size="sm"
            className="w-full"
            onClick={() => savePosInstructionsMutation.mutate(posInstructions)}
            disabled={savePosInstructionsMutation.isPending}
          >
            {savePosInstructionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Instructions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
