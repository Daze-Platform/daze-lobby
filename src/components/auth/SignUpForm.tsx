import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { signUp } from "@/lib/auth";
import { lovable } from "@/integrations/lovable";
import dazeLogo from "@/assets/daze-logo.png";

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        setError(error.message || "Failed to sign in with Google");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div 
        className="w-full bg-white rounded-[2rem] p-8"
        style={{
          boxShadow: "0 10px 40px -10px rgba(14, 165, 233, 0.3)",
        }}
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div 
              className="h-16 w-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(14, 165, 233, 0.1)" }}
            >
              <CheckCircle className="h-8 w-8" style={{ color: "#0EA5E9" }} />
            </div>
          </div>
          <h1 className="font-display text-xl font-semibold text-slate-900">Check your email</h1>
          <p className="text-muted-foreground text-sm mt-2 mb-6">
            We've sent you a verification link. Please check your email to confirm your account.
          </p>
          <Button 
            onClick={onSwitchToLogin} 
            className="w-full rounded-xl text-white"
            style={{ backgroundColor: "#0EA5E9" }}
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-white rounded-[2rem] p-8"
      style={{
        boxShadow: "0 10px 40px -10px rgba(14, 165, 233, 0.3)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex flex-col items-center justify-center mb-4">
          <img src={dazeLogo} alt="Daze" className="h-16 w-16 object-contain mb-3" />
          <span className="font-display text-2xl font-bold tracking-tight text-slate-900">Daze Lobby</span>
        </div>
        <h1 className="font-display text-xl font-semibold text-slate-900">Create an account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Join the Control Tower operations team
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-0 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
            className="rounded-xl"
          />
        </div>
        
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
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            className="rounded-xl"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full rounded-xl text-white"
          style={{ backgroundColor: "#0EA5E9" }}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-2">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium transition-colors"
            style={{ color: "#F97316" }}
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}
