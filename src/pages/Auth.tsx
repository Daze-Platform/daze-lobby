import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);


  return (
    <div className="min-h-screen flex">
      {/* Left Side - The Form (Clean White) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-6 md:p-12">
        <div className="w-full max-w-md">
          {isLogin ? (
            <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>

      {/* Right Side - The Sketchy Art Panel */}
      <div className="hidden lg:block lg:w-1/2">
        <SketchyArtPanel />
      </div>

      {/* Test Button for Client Portal Preview */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => navigate("/portal-preview")}
          className="gap-2 shadow-lg"
        >
          <Eye className="w-4 h-4" />
          Preview Client Portal
        </Button>
      </div>
    </div>
  );
}
