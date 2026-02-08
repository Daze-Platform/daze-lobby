import { createContext, useContext, ReactNode, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { UserWithRole, AppRole } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: AppRole | null;
  refetchUser: () => Promise<UserWithRole | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  // Global unhandled rejection handler for auth errors
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[AuthProvider] Unhandled rejection:", event.reason);
      
      // Only show toast for auth-related errors
      const errorMessage = event.reason?.message || "An unexpected error occurred";
      if (errorMessage.toLowerCase().includes("auth") || 
          errorMessage.toLowerCase().includes("session") ||
          errorMessage.toLowerCase().includes("token")) {
        toast({
          title: "Authentication Error",
          description: "Please try signing in again.",
          variant: "destructive",
        });
      }
      
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
