import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { signIn } from "@/lib/auth";
import { lovable } from "@/integrations/lovable";
import dazeLogo from "@/assets/daze-logo.png";

interface LoginFormProps {
  onSwitchToSignUp: () => void;
}

export function LoginForm({ onSwitchToSignUp }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

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
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
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
        setError(error.message || "Failed to sign in with Google");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div 
      className="w-full bg-white rounded-[2rem] p-8 animate-fade-in-up"
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
        <h1 className="font-display text-xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-muted-foreground text-sm mt-1">
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
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className={`rounded-xl ${error ? 'ring-destructive/50' : ''}`}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full rounded-xl text-white"
          style={{ backgroundColor: "#0EA5E9" }}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
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
