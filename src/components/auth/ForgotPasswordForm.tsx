import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import dazeLogo from "@/assets/daze-logo.png";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=1`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="w-full bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 md:p-8 animate-fade-in-up"
      style={{
        boxShadow: "0 10px 40px -10px rgba(14, 165, 233, 0.3)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex flex-row items-center justify-center gap-2 mb-3 sm:mb-4">
          <img src={dazeLogo} alt="Daze" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Daze Lobby</span>
        </div>
        <h1 className="font-display text-lg sm:text-xl font-semibold text-slate-900">Reset your password</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {success ? (
        <div className="space-y-4">
          <Alert className="border-0 bg-primary/10">
            <Mail className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              Check your email! We've sent a password reset link to <strong>{email}</strong>
            </AlertDescription>
          </Alert>
          <Button 
            variant="ghost" 
            className="w-full gap-2"
            onClick={onBackToLogin}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-0 bg-destructive/10 animate-fade-in-up">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="rounded-xl"
              style={{ backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid #e2e8f0' }}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full rounded-xl text-white min-h-[44px]"
            style={{ backgroundColor: "#0EA5E9" }}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>

          <Button 
            type="button"
            variant="ghost" 
            className="w-full gap-2"
            onClick={onBackToLogin}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>
        </form>
      )}
    </div>
  );
}
