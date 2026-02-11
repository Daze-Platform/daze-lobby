import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Image, Loader2, X, FileText, Save, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const POS_PROVIDERS = [
  { id: "toast", name: "Toast", logo: "/pos-logos/toast.svg" },
  { id: "ncr_aloha", name: "NCR Aloha", logo: "/pos-logos/ncr-aloha.svg" },
  { id: "par_brink", name: "PAR Brink", logo: "" },
  { id: "dinerware", name: "Dinerware", logo: "" },
  { id: "micros_simphony", name: "Micros Simphony", logo: "/pos-logos/oracle-micros.svg" },
  { id: "micros_3700", name: "Micros 3700", logo: "/pos-logos/oracle-micros.svg" },
  { id: "positouch", name: "POSitouch", logo: "" },
  { id: "squirrel_systems", name: "Squirrel Systems", logo: "" },
  { id: "xpient", name: "XPIENT", logo: "" },
  { id: "maitred", name: "Maitre'D", logo: "" },
  { id: "ncr_cloud_connect", name: "NCR Cloud Connect", logo: "/pos-logos/ncr-aloha.svg" },
  { id: "simphony_fe", name: "Simphony FE", logo: "/pos-logos/oracle-micros.svg" },
  { id: "simphonycloud", name: "SimphonyCloud", logo: "/pos-logos/oracle-micros.svg" },
  { id: "other", name: "Other", logo: "" },
];

interface AdminBrandPosControlsProps {
  clientId: string;
  currentLogoUrl?: string | null;
  currentBrandPalette?: string[] | null;
  currentPosInstructions?: string | null;
  currentPosProvider?: string | null;
}

export function AdminBrandPosControls({
  clientId,
  currentLogoUrl,
  currentBrandPalette,
  currentPosInstructions,
  currentPosProvider,
}: AdminBrandPosControlsProps) {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  
  const [posInstructions, setPosInstructions] = useState(currentPosInstructions || "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl || null);
  const [selectedPosProvider, setSelectedPosProvider] = useState<string>(currentPosProvider || "");

  // Sync state when props change
  useEffect(() => {
    
    setPosInstructions(currentPosInstructions || "");
    setLogoPreview(currentLogoUrl || null);
    setSelectedPosProvider(currentPosProvider || "");
  }, [currentPosInstructions, currentLogoUrl, currentPosProvider]);

  

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
    mutationFn: async ({ instructions, provider }: { instructions: string; provider: string }) => {
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
              ...(provider ? { provider } : {}),
            },
          })
          .eq("id", task.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks", clientId] });
      toast.success("POS settings saved");
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
      {/* POS Provider Selection */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            POS Provider
          </CardTitle>
          <CardDescription className="text-xs">
            Select the client's point-of-sale system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPosProvider} onValueChange={setSelectedPosProvider}>
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="Select POS provider" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {POS_PROVIDERS.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    {provider.logo ? (
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className="w-5 h-5 object-contain rounded-sm"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Store className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span>{provider.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

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
            onClick={() => savePosInstructionsMutation.mutate({ instructions: posInstructions, provider: selectedPosProvider })}
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
