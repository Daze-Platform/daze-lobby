import { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, UserWithRole } from "@/lib/auth";

// Auth hook with proper loading state management
// Fixes race condition where loading state was set to false before user data was fetched

export function useAuth() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadComplete = useRef(false);
  const isFetchingUser = useRef(false);

  const fetchUser = useCallback(async (): Promise<UserWithRole | null> => {
    // Prevent concurrent fetches
    if (isFetchingUser.current) return null;
    isFetchingUser.current = true;
    
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      return null;
    } finally {
      isFetchingUser.current = false;
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
    // This fires AFTER initializeAuth completes for existing sessions
    // and also fires when user signs in/out
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) return;

      // Update session immediately
      setSession(nextSession);

      // Handle sign in - await user fetch to complete before removing loading
      if (event === "SIGNED_IN" && nextSession?.user) {
        // Set loading true during sign-in transition
        if (initialLoadComplete.current) {
          setLoading(true);
        }
        
        await fetchUser();
        
        if (isMounted) {
          setLoading(false);
        }
      } 
      // Handle sign out
      else if (event === "SIGNED_OUT") {
        setUser(null);
        if (isMounted && initialLoadComplete.current) {
          setLoading(false);
        }
      }
      // Handle token refresh and other events
      else if (nextSession?.user && initialLoadComplete.current) {
        // Fire and forget for token refresh - user data should already be loaded
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
