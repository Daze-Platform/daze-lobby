/**
 * Error handling utilities for type-safe error handling
 * Replaces `: any` types in catch blocks
 */

export interface AuthError extends Error {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Type guard to check if an error is an AuthError
 */
export function isAuthError(err: unknown): err is AuthError {
  return err instanceof Error;
}

/**
 * Safely extract error message from unknown error types
 * Use in catch blocks instead of `: any`
 */
export function getErrorMessage(err: unknown): string {
  if (isAuthError(err)) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred";
}
