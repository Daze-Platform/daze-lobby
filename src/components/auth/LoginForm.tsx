import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { signIn } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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
  const ok = !!url && !!key;

  if (!ok) {
    console.error(
      "[LoginForm] Missing backend env vars (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)."
    );
  }

  return ok;
};

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

export function LoginForm({ onSwitchToSignUp, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const navigationAttemptedRef = useRef(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuthContext();

  // Check for existing session on mount - handles "silent success"
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log("[LoginForm] Checking for existing session on mount...");

        const sessionResult = await withTimeout(
          supabase.auth.getSession(),
          8000,
          "Session check timed out"
        );
        const session = (sessionResult as { data: { session: unknown } })?.data?.session ?? null;

        if (session && !navigationAttemptedRef.current) {
          console.log("[LoginForm] Existing session found, redirecting immediately");
          navigationAttemptedRef.current = true;
          navigate("/post-auth", { replace: true });
        }
      } catch (err) {
        console.error("[LoginForm] Error checking session:", err);
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
      console.log("[LoginForm] Auth context confirmed, navigating...");
      navigationAttemptedRef.current = true;
      navigate("/post-auth", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) {
      console.log("[LoginForm] Already processing login, ignoring");
      return;
    }

    if (!isBackendConfigured()) {
      const errorMessage = "App is misconfigured (missing backend settings).";
      setError(errorMessage);
      toast({
        title: "Configuration Error",
        description: "Sign-in is temporarily unavailable. Please refresh or contact support.",
        variant: "destructive",
      });
      return;
    }

    console.log("[LoginForm] Login attempt started");
    setLoading(true);
    setError(null);

    try {
      // Handle "silent success" / in-flight sessions
      const preSessionResult = await withTimeout(
        supabase.auth.getSession(),
        8000,
        "Session check timed out"
      );
      const preSession = (preSessionResult as { data: { session: unknown } })?.data?.session ?? null;

      if (preSession && !navigationAttemptedRef.current) {
        console.log("[LoginForm] Session already present, redirecting");
        navigationAttemptedRef.current = true;
        navigate("/post-auth", { replace: true });
        return;
      }

      const result = await withTimeout(
        signIn(email, password),
        15000,
        "Sign in timed out. Please try again."
      );
      console.log("[LoginForm] Supabase response received:", result.user?.email);

      const session =
        (result as { session?: unknown })?.session ??
        ((await withTimeout(
          supabase.auth.getSession(),
          8000,
          "Session check timed out"
        )) as { data: { session: unknown } })?.data?.session ??
        null;

      if (session && !navigationAttemptedRef.current) {
        console.log("[LoginForm] Session confirmed, redirecting");
        navigationAttemptedRef.current = true;
        navigate("/post-auth", { replace: true });
        return;
      }

      // If we get here without a session, something unexpected happened
      console.warn("[LoginForm] Sign-in succeeded but no session found");
      setError("Authentication succeeded but session not established. Please try again.");
      toast({
        title: "Authentication Issue",
        description: "Please try signing in again.",
        variant: "destructive",
      });
    } catch (err: unknown) {
      console.error("[LoginForm] Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in";
      setError(errorMessage);
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // CRITICAL: Always reset loading state to prevent infinite spinner
      setLoading(false);
      console.log("[LoginForm] Login attempt finalized, loading reset");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        const errorMessage = error.message || "Failed to sign in with Google";
        setError(errorMessage);
        toast({
          title: "Google Sign In Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in with Google";
      setError(errorMessage);
      toast({
        title: "Google Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
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
        <div className="flex flex-col items-center justify-center mb-3 sm:mb-4">
          <img src={dazeLogo} alt="Daze" className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain mb-2 sm:mb-3" />
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Daze Lobby</span>
        </div>
        <h1 className="font-display text-lg sm:text-xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Sign in to access the Control Tower
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-medium transition-all duration-200 hover:underline"
              style={{ color: "#0EA5E9" }}
            >
              Forgot password?
            </button>
          </div>
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
          className="w-full rounded-xl text-white min-h-[44px]"
          style={{ backgroundColor: "#0EA5E9" }}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
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

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl gap-2 min-h-[44px]"
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
          Sign in with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-2">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 inline-block"
            style={{ color: "#F97316" }}
          >
            Sign up
          </button>
        </p>
      </form>
    </div>
  );
}
