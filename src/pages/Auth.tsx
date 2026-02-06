import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      {isLogin ? (
        <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
      ) : (
        <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
      )}

      {/* Test Button for Client Portal Preview */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => navigate("/portal-preview")}
          className="gap-2 shadow-soft-md"
        >
          <Eye className="w-4 h-4" />
          Preview Client Portal
        </Button>
      </div>
    </div>
  );
}
