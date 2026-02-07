import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { SketchyArtPanel } from "@/components/auth/SketchyArtPanel";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AuthView = "login" | "signup" | "forgot-password" | "reset-password";

export default function Auth() {
  const [view, setView] = useState<AuthView>("login");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if user arrived via password reset link
  useEffect(() => {
    const isReset = searchParams.get("reset") === "1";
    
    if (isReset) {
      // Listen for the PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setView("reset-password");
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - The Form (Clean White) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4 sm:p-6 md:p-8 lg:p-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {view === "login" && (
            <LoginForm 
              onSwitchToSignUp={() => setView("signup")} 
              onForgotPassword={() => setView("forgot-password")}
            />
          )}
          {view === "signup" && (
            <SignUpForm onSwitchToLogin={() => setView("login")} />
          )}
          {view === "forgot-password" && (
            <ForgotPasswordForm onBackToLogin={() => setView("login")} />
          )}
          {view === "reset-password" && (
            <ResetPasswordForm />
          )}
        </div>
      </div>

      {/* Right Side - The Sketchy Art Panel (hidden on mobile/tablet, gradient fallback) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <SketchyArtPanel />
      </div>

      {/* Mobile/Tablet gradient background overlay (visible when art panel is hidden) */}
      <div 
        className="fixed inset-0 -z-10 lg:hidden"
        style={{
          background: "linear-gradient(135deg, hsl(210 20% 98%) 0%, hsl(214 32% 96%) 100%)"
        }}
      />

      {/* Test Button for Client Portal Preview */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => navigate("/portal-preview")}
          className="gap-2 shadow-lg min-h-[44px]"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Preview Client Portal</span>
          <span className="sm:hidden">Preview</span>
        </Button>
      </div>
    </div>
  );
}
