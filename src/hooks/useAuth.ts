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
      async (event, currentSession) => {
        console.log("[Auth] Auth event received:", event, currentSession?.user?.email);
        
        if (!isMountedRef.current) return;

        // Update session immediately
        setSession(currentSession);

        if (currentSession?.user) {
          // Use setTimeout to avoid blocking the auth state update
          // This ensures the session state is set before we fetch user profile
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchUser();
            }
          }, 0);
        } else {
          setUser(null);
        }

        // After initial load, auth events should not reset loading
        // But if we're still in initial load, mark it complete on SIGNED_IN
        if (!initialLoadComplete && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          initialLoadComplete = true;
          if (isMountedRef.current && loading) {
            // Small delay to allow user fetch to start
            setTimeout(() => {
              if (isMountedRef.current) {
                setLoading(false);
              }
            }, 100);
          }
        }
      }
    );

    // THEN check for existing session (listener is already ready to catch events)
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

        // Only set session if listener hasn't already done so
        if (initialSession) {
          setSession((prev) => prev || initialSession);
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
