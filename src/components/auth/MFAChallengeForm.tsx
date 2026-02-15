import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import dazeLogo from "@/assets/daze-logo.png";

interface MFAChallengeFormProps {
  factorId: string;
  onCancel: () => void;
}

export function MFAChallengeForm({ factorId, onCancel }: MFAChallengeFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setLoading(true);
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

      navigate("/post-auth", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
      setCode("");
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 md:p-8 animate-fade-in-up"
      style={{ boxShadow: "0 10px 40px -10px rgba(14, 165, 233, 0.3)" }}
    >
      <div className="text-center mb-6">
        <div className="flex flex-row items-center justify-center gap-2 mb-4">
          <img src={dazeLogo} alt="Daze" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
           <span className="font-display text-xl sm:text-2xl font-bold tracking-tight" style={{ color: '#1e293b' }}>
            Daze Lobby
          </span>
        </div>
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-lg sm:text-xl font-semibold" style={{ color: '#1e293b' }}>
          Two-Factor Authentication
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: '#64748b' }}>
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="border-0 bg-destructive/10 animate-fade-in-up mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center gap-6">
        <div className="space-y-2 w-full flex flex-col items-center">
          <Label className="text-sm font-medium" style={{ color: '#1e293b' }}>Verification Code</Label>
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            onComplete={handleVerify}
            disabled={loading}
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

        <Button
          className="w-full rounded-xl text-white min-h-[44px]"
          style={{ backgroundColor: "#0EA5E9" }}
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>

        <button
          type="button"
          onClick={onCancel}
          className="text-sm transition-colors"
          style={{ color: '#64748b' }}
        >
          Cancel & sign out
        </button>
      </div>
    </div>
  );
}
