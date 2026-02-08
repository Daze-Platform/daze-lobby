import { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, UserWithRole } from "@/lib/auth";

// Auth hook with proper loading state management
// Separates initial load from ongoing auth changes to prevent race conditions

export function useAuth() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  const fetchUser = useCallback(async (): Promise<UserWithRole | null> => {
    try {
      const currentUser = await getCurrentUser();
      if (isMountedRef.current) {
        setUser(currentUser);
      }
      return currentUser;
    } catch (error) {
      console.error("Error fetching user:", error);
      if (isMountedRef.current) {
        setUser(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // INITIAL load (controls loading state)
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!isMountedRef.current) return;

        setSession(initialSession);

        // Fetch user role BEFORE setting loading to false
        if (initialSession?.user) {
          await fetchUser();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Listener for ONGOING auth changes (does NOT control loading after initial load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMountedRef.current) return;

        setSession(currentSession);

        // Fire and forget - don't await, don't affect loading state
        if (currentSession?.user) {
          fetchUser();
        } else {
          setUser(null);
        }
      }
    );

    initializeAuth();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!session,
    role: user?.role || null,
    refetchUser: fetchUser,
  };
}
