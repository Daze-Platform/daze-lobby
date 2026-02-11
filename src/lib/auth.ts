import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "ops_manager" | "support" | "client";

export interface UserWithRole {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: AppRole | null;
}

export async function signUp(email: string, password: string, fullName: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo || window.location.origin,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get user's role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get user's profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email || "",
    fullName: profileData?.full_name || null,
    avatarUrl: profileData?.avatar_url || null,
    role: roleData?.role as AppRole | null,
  };
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.role as AppRole;
}

export function canManageClients(role: AppRole | null): boolean {
  return role === "admin" || role === "ops_manager";
}

export function isAdmin(role: AppRole | null): boolean {
  return role === "admin";
}

export function isClient(role: AppRole | null): boolean {
  return role === "client";
}

export function hasDashboardAccess(role: AppRole | null): boolean {
  return role === "admin" || role === "ops_manager" || role === "support";
}

/**
 * Force-clean the session, including manual storage removal for privacy browsers (Brave).
 * Use when switching between admin/client roles on the same browser.
 */
export async function forceCleanSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // signOut may throw if session already invalid
  }
  // Explicitly wipe Supabase auth tokens from storage (Brave workaround)
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (projectId) {
    const storageKey = `sb-${projectId}-auth-token`;
    try {
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
    } catch {
      // Storage access may be blocked
    }
  }
}
