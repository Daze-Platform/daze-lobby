import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { signUp } from "@/lib/auth";
import dazeLogo from "@/assets/daze-logo.png";

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      <Card className="w-full max-w-md shadow-soft-xl">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </div>
          <CardTitle className="font-display text-xl font-semibold">Check your email</CardTitle>
          <CardDescription className="text-muted-foreground">
            We've sent you a verification link. Please check your email to confirm your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button onClick={onSwitchToLogin} className="w-full">
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-soft-xl">
      <CardHeader className="space-y-1 text-center pb-2">
        <div className="flex flex-col items-center justify-center mb-4">
          <img src={dazeLogo} alt="Daze" className="h-16 w-16 object-contain mb-3" />
          <span className="font-display text-2xl font-bold tracking-tight">Daze Lobby</span>
        </div>
        <CardTitle className="font-display text-xl font-semibold">Create an account</CardTitle>
        <CardDescription className="text-muted-foreground">
          Join the Control Tower operations team
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
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
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
