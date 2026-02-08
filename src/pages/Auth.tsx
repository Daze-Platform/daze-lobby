import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { SketchyArtPanel } from "@/components/auth/SketchyArtPanel";
import { supabase } from "@/integrations/supabase/client";

type AuthView = "login" | "signup" | "forgot-password" | "reset-password";

export default function Auth() {
  const [view, setView] = useState<AuthView>("login");
  const [searchParams] = useSearchParams();

  // Check if user arrived via password reset link
  useEffect(() => {
    // Check URL hash for recovery token (Supabase adds tokens to hash fragment)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    // If this is a recovery flow, show reset form immediately
    if (type === 'recovery') {
      setView("reset-password");
      return;
    }
    
    // Also check for reset query param as fallback
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
    </div>
  );
}
