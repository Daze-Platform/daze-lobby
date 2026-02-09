import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Eye, EyeOff, Mail } from "lucide-react";
import { signIn } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import dazeLogo from "@/assets/daze-logo.png";

const withTimeout = async <T,>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => {
    const id = window.setTimeout(() => {
      window.clearTimeout(id);
      reject(new Error(message));
    }, ms);
  });

  return (await Promise.race([promise, timeout])) as T;
};

const isBackendConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return !!url && !!key;
};

export function ClientLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const navigationAttemptedRef = useRef(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuthContext();

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const sessionResult = await withTimeout(
          supabase.auth.getSession(),
          8000,
          "Session check timed out"
        );
        const session = (sessionResult as any)?.data?.session ?? null;

        if (session && !navigationAttemptedRef.current) {
          navigationAttemptedRef.current = true;
          navigate("/post-auth", { replace: true });
        }
      } catch (err) {
        console.error("[ClientLoginForm] Error checking session:", err);
      }
    };

    checkExistingSession();
  }, [navigate]);

  // Trigger shake animation on error
  useEffect(() => {
    if (error) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Navigate when auth state confirms login
  useEffect(() => {
    if (isAuthenticated && !authLoading && !navigationAttemptedRef.current) {
      navigationAttemptedRef.current = true;
      navigate("/post-auth", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (!isBackendConfigured()) {
      setError("App is misconfigured (missing backend settings).");
      toast({
        title: "Configuration Error",
        description: "Sign-in is temporarily unavailable. Please refresh or contact support.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const preSessionResult = await withTimeout(
        supabase.auth.getSession(),
        8000,
        "Session check timed out"
      );
      const preSession = (preSessionResult as any)?.data?.session ?? null;

      if (preSession && !navigationAttemptedRef.current) {
        navigationAttemptedRef.current = true;
        navigate("/post-auth", { replace: true });
        return;
      }

      const result = await withTimeout(
        signIn(email, password),
        15000,
        "Sign in timed out. Please try again."
      );

      const session =
        (result as any)?.session ??
        ((await withTimeout(
          supabase.auth.getSession(),
          8000,
          "Session check timed out"
        )) as any)?.data?.session ??
        null;

      if (session && !navigationAttemptedRef.current) {
        navigationAttemptedRef.current = true;
        navigate("/post-auth", { replace: true });
        return;
      }

      setError("Authentication succeeded but session not established. Please try again.");
      toast({
        title: "Authentication Issue",
        description: "Please try signing in again.",
        variant: "destructive",
      });
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to sign in";
      setError(errorMessage);
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-background rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 md:p-8 animate-fade-in-up shadow-lg">
      {/* Header - Partner Portal branding */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex flex-col items-center justify-center mb-3 sm:mb-4">
          <img 
            src={dazeLogo} 
            alt="Daze" 
            className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain mb-2 sm:mb-3" 
          />
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Partner Portal
          </span>
        </div>
        <h1 className="font-display text-lg sm:text-xl font-semibold text-foreground">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Access your onboarding portal
        </p>
      </div>

      {/* Form */}
      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className={`space-y-4 ${shouldShake ? 'animate-shake' : ''}`}
      >
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
            className={`rounded-xl ${error ? 'ring-destructive/50' : ''}`}
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
              disabled={loading}
              className={`rounded-xl pr-10 ${error ? 'ring-destructive/50' : ''}`}
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
        </div>

        <Button 
          type="submit" 
          className="w-full rounded-xl min-h-[44px] bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In to Portal
        </Button>

        {/* Help link instead of sign-up */}
        <div className="text-center pt-2">
          <a
            href="mailto:support@daze.com"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4" />
            Need help? Contact support
          </a>
        </div>
      </form>
    </div>
  );
}
