/**
 * Authentication and authorization type definitions
 * Centralized types for user roles and auth state
 */

/**
 * Application role levels
 * - admin: Full access to all features
 * - ops_manager: Can manage clients and operations
 * - support: View-only dashboard access
 * - client: Portal access for assigned client only
 */
export type AppRole = "admin" | "ops_manager" | "support" | "client";

/**
 * User with role information
 * Extended user data for auth context
 */
export interface UserWithRole {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: AppRole | null;
}

/**
 * Check if role has permission to manage clients
 */
export function canManageClients(role: AppRole | null): boolean {
  return role === "admin" || role === "ops_manager";
}

/**
 * Check if role is admin
 */
export function isAdmin(role: AppRole | null): boolean {
  return role === "admin";
}

/**
 * Check if role is client
 */
export function isClient(role: AppRole | null): boolean {
  return role === "client";
}

/**
 * Check if role has dashboard access
 */
export function hasDashboardAccess(role: AppRole | null): boolean {
  return role === "admin" || role === "ops_manager" || role === "support";
}
