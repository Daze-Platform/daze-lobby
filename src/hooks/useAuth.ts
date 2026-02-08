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
  const initialLoadComplete = useRef(false);

  const fetchUser = useCallback(async (): Promise<UserWithRole | null> => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // INITIAL load (controls loading state)
    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(initialSession);

        // Fetch user role BEFORE setting loading to false
        if (initialSession?.user) {
          await fetchUser();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (isMounted) {
          initialLoadComplete.current = true;
          setLoading(false);
        }
      }
    };

    // Listener for ONGOING auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);

      if (event === "SIGNED_IN" && nextSession?.user) {
        if (initialLoadComplete.current) {
          setLoading(true);
        }
        await fetchUser();
        if (isMounted) {
          setLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        if (isMounted && initialLoadComplete.current) {
          setLoading(false);
        }
      } else if (nextSession?.user && initialLoadComplete.current) {
        fetchUser();
      } else if (!nextSession) {
        setUser(null);
      }
    });

    initializeAuth();

    return () => {
      isMounted = false;
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
