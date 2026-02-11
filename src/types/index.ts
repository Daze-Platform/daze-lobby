/**
 * Centralized type exports
 * Import types from here: import type { Client, Venue } from "@/types"
 */

// Client types
export type {
  ClientRow,
  ClientContactRow,
  LifecyclePhase,
  Client,
  ClientContext,
  LegalEntity,
  LegalEntityFormData,
} from "./client";

// Venue types
export type {
  VenueRow,
  Venue,
  VenueMenu,
  VenueUpdate,
  DbVenue,
  DbVenueMenu,
} from "./venue";

// Task types
export type {
  OnboardingTask,
  TaskKey,
  FormattedTask,
} from "./task";
export { DEFAULT_TASKS } from "./task";

// Auth types
export type {
  AppRole,
  UserWithRole,
} from "./auth";
export {
  canManageClients,
  isAdmin,
  isClient,
  hasDashboardAccess,
} from "./auth";

// Error utilities
export type { AuthError } from "./errors";
export { isAuthError, getErrorMessage } from "./errors";
