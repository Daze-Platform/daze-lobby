import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, UserWithRole, AppRole } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUserDeferred = async () => {
      // Defer to avoid potential auth deadlock, but still await so routing has role info.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await fetchUser();
    };

    // Set up auth state listener BEFORE getting session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);

      if (nextSession?.user) {
        setLoading(true);
        await fetchUserDeferred();
      } else {
        setUser(null);
      }

      if (isMounted) setLoading(false);
    });

    // Get initial session (some environments don’t reliably fire INITIAL_SESSION)
    (async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(initialSession);

      if (initialSession?.user) {
        setLoading(true);
        await fetchUserDeferred();
      }

      if (isMounted) setLoading(false);
    })();

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
