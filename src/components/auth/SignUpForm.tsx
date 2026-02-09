import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { signUp } from "@/lib/auth";
import { lovable } from "@/integrations/lovable";
import dazeLogo from "@/assets/daze-logo.png";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const showStrengthIndicator = password.length > 0;

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValidation.isAcceptable) {
      setError("Please choose a stronger password");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
              className="rounded-xl pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <PasswordStrengthIndicator 
            validation={passwordValidation} 
            show={showStrengthIndicator} 
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

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google Sign Up */}
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl gap-2"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Sign up with Google
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
