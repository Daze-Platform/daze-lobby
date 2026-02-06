import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { SketchyArtPanel } from "@/components/auth/SketchyArtPanel";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const forceAuth = new URLSearchParams(location.search).get("force") === "1";

  useEffect(() => {
    if (!forceAuth && !loading && isAuthenticated) {
      navigate("/");
    }
  }, [forceAuth, isAuthenticated, loading, navigate]);


  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - The Form (Clean White) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4 sm:p-6 md:p-8 lg:p-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {isLogin ? (
            <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
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
