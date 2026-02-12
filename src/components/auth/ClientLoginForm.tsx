import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OrDivider } from "@/components/ui/or-divider";
import { Loader2, AlertCircle, Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import { signIn, signUp } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
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
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState(false);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const showStrengthIndicator = mode === "signup" && password.length > 0;

  const postAuthPath = returnTo
    ? `/post-auth?origin=portal&returnTo=${encodeURIComponent(returnTo)}`
    : "/post-auth?origin=portal";

  // Session detection and role-based redirects are handled by AuthRedirect (route wrapper).
  // This form only handles submission logic.

  // Trigger shake animation on error
  useEffect(() => {
    if (error) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!isBackendConfigured()) {
      setError("App is misconfigured (missing backend settings).");
      return;
    }

    // Signup-specific validation
    if (mode === "signup" && !passwordValidation.isAcceptable) {
      setError("Please choose a stronger password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const redirectUrl = returnTo
          ? `${window.location.origin}/post-auth?origin=portal&returnTo=${encodeURIComponent(returnTo)}`
          : `${window.location.origin}/post-auth?origin=portal`;
        await withTimeout(signUp(email, password, fullName, redirectUrl), 15000, "Sign up timed out. Please try again.");
        setSignupSuccess(true);
      } else {
        // Login flow
        const result = await withTimeout(signIn(email, password), 15000, "Sign in timed out. Please try again.");

        // Check if user has an admin role — block them from client portal
        const userId = (result as { user?: { id: string } })?.user?.id;
        if (userId) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();

          const userRole = roleData?.role;
          if (userRole === "admin" || userRole === "ops_manager" || userRole === "support") {
            await supabase.auth.signOut();
            setError("This portal is for hotel partners only. Please sign in at the admin dashboard.");
            setLoading(false);
            return;
          }
        }

        const session =
          (result as { session?: unknown })?.session ??
          ((await withTimeout(supabase.auth.getSession(), 8000, "Session check timed out")) as { data: { session: unknown } })?.data?.session ??
          null;

        if (session) {
          navigate(postAuthPath, { replace: true });
          return;
        }

        setError("Authentication succeeded but session not established. Please try again.");
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "Failed to sign in";
      const isInvalidCreds = rawMessage.toLowerCase().includes("invalid login credentials");
      const errorMessage = isInvalidCreds
        ? "No account found with these credentials. Please sign up first."
        : rawMessage;
      setError(errorMessage);
      if (isInvalidCreds && mode === "login") {
        setShowSignUpPrompt(true);
      }
      toast({ title: mode === "signup" ? "Sign Up Failed" : "Sign In Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    setError(null);
    try {
      const redirectUrl = returnTo
        ? `${window.location.origin}/post-auth?origin=portal&returnTo=${encodeURIComponent(returnTo)}`
        : `${window.location.origin}/post-auth?origin=portal`;
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectUrl,
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

  // Signup success screen
  if (signupSuccess) {
    return (
      <div className="w-full bg-background rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 md:p-8 animate-fade-in-up shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full flex items-center justify-center bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-xl font-semibold text-foreground">Check your email</h1>
          <p className="text-muted-foreground text-sm mt-2 mb-6">
            We've sent you a verification link. Please check your email to confirm your account.
          </p>
          <Button
            onClick={() => { setSignupSuccess(false); setMode("login"); }}
            className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 md:p-8 animate-fade-in-up shadow-lg">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex flex-col items-center justify-center mb-3 sm:mb-4">
          <img src={dazeLogo} alt="Daze" className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain mb-2 sm:mb-3" />
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Partner Portal
          </span>
        </div>
        <h1 className="font-display text-lg sm:text-xl font-semibold text-foreground">
          {mode === "signup" ? "Create your account" : "Sign in to your portal"}
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          {mode === "signup" ? "Sign up to access your onboarding portal" : "Enter your credentials to continue"}
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
            <AlertDescription>
              {error}
              {showSignUpPrompt && (
                <Button
                  type="button"
                  variant="link"
                  className="ml-1 p-0 h-auto text-destructive underline underline-offset-2"
                  onClick={() => { setShowSignUpPrompt(false); setError(null); setMode("signup"); }}
                >
                  Back to Sign Up
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Full Name - signup only */}
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="rounded-xl"
            />
          </div>
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
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {showStrengthIndicator && (
            <PasswordStrengthIndicator validation={passwordValidation} show={true} />
          )}
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl min-h-[44px] bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={loading || googleLoading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "signup" ? "Create Account" : "Sign In to Portal"}
        </Button>

        <OrDivider className="my-4" />

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl min-h-[44px] border-border hover:bg-secondary/50"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
        </Button>

        {/* Mode toggle */}
        <div className="text-center pt-2">
          {mode === "login" ? (
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                className="font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                className="font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
