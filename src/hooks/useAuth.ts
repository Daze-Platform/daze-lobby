import { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, UserWithRole } from "@/lib/auth";

/**
 * Auth hook with LISTENER-FIRST architecture
 * 
 * Critical: The onAuthStateChange listener MUST be set up BEFORE
 * calling getSession() to ensure we never miss auth events.
 * This prevents the "first-click doesn't work" bug.
 */

export function useAuth() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);
  // Ref to prevent duplicate user fetches
  const fetchInProgressRef = useRef(false);

  const fetchUser = useCallback(async (): Promise<UserWithRole | null> => {
    // Prevent duplicate fetches
    if (fetchInProgressRef.current) {
      console.log("[Auth] Fetch already in progress, skipping");
      return user;
    }
    
    fetchInProgressRef.current = true;
    console.log("[Auth] Fetching user profile...");
    
    try {
      const currentUser = await getCurrentUser();
      if (isMountedRef.current) {
        setUser(currentUser);
        console.log("[Auth] User profile loaded:", currentUser?.email);
      }
      return currentUser;
    } catch (error) {
      console.error("[Auth] Error fetching user:", error);
      if (isMountedRef.current) {
        setUser(null);
      }
      return null;
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    isMountedRef.current = true;
    let initialLoadComplete = false;

    console.log("[Auth] Initializing auth system...");

    // CRITICAL: Set up listener FIRST, before checking session
    // This ensures we catch any auth events that fire during initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("[Auth] Auth event received:", event, currentSession?.user?.email);
        
        if (!isMountedRef.current) return;

        // Update session immediately
        setSession(currentSession);

        if (currentSession?.user) {
          // Fire and forget for ongoing changes – don't control loading
          if (initialLoadComplete) {
            fetchUser();
          }
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session (listener is already ready to catch events)
    // CRITICAL: Fetch role BEFORE setting loading to false to prevent redirect race
    const initializeAuth = async () => {
      console.log("[Auth] Checking for existing session...");
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Session check timed out")), 10000)
          ),
        ]);

        const initialSession = (sessionResult as any)?.data?.session ?? null;

        if (!isMountedRef.current) return;

        console.log("[Auth] Initial session check:", initialSession?.user?.email || "no session");

        if (initialSession) {
          setSession(initialSession);
          // Await user+role fetch BEFORE marking load complete
          await fetchUser();
        }
      } catch (error) {
        console.error("[Auth] Error initializing auth:", error);
      } finally {
        if (isMountedRef.current) {
          initialLoadComplete = true;
          setLoading(false);
          console.log("[Auth] Initial load complete");
        }
      }
    };

    initializeAuth();

    return () => {
      console.log("[Auth] Cleaning up auth listener");
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
