import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CircleNotch, CheckCircle } from "@phosphor-icons/react";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    enrollFactor();
  }, []);

  const enrollFactor = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to set up 2FA";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6 || !factorId) return;

    setVerifying(true);
    setError(null);

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) throw verifyError;

      toast.success("Two-factor authentication enabled!");
      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = async () => {
    // Unenroll the pending factor if we created one
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch {
        // Ignore errors on cleanup
      }
    }
    onCancel();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <CircleNotch size={24} weight="regular" className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 rounded-lg bg-background/50">
      <div className="text-center space-y-1">
        <h4 className="text-sm font-semibold">Set Up Two-Factor Authentication</h4>
        <p className="text-xs text-muted-foreground">
          Scan the QR code with your authenticator app (Google Authenticator, 1Password, etc.)
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="border-0 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {qrCode && (
        <div className="flex justify-center py-2">
          <img src={qrCode} alt="Scan this QR code with your authenticator app" className="w-48 h-48" />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs font-medium">Enter the 6-digit code from your app</Label>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            onComplete={handleVerify}
            disabled={verifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleVerify}
          disabled={verifying || code.length !== 6}
          className="gap-1"
        >
          {verifying ? (
            <CircleNotch size={14} weight="regular" className="animate-spin" />
          ) : (
            <CheckCircle size={14} weight="duotone" />
          )}
          Verify & Enable
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={verifying}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
