import { createContext, useContext, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { UserWithRole, AppRole } from "@/lib/auth";

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: AppRole | null;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

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
