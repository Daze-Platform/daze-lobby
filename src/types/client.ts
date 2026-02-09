/**
 * Client-related type definitions
 * Centralized types for client/hotel data models
 */

import type { Tables, Enums } from "@/integrations/supabase/types";

// Core database types
export type ClientRow = Tables<"clients">;
export type ClientContactRow = Tables<"client_contacts">;
export type LifecyclePhase = Enums<"lifecycle_phase">;

/**
 * Extended client with computed fields for UI consumption
 * Used by useClients hook and Kanban board
 */
export interface Client extends ClientRow {
  hasBlocker: boolean;
  primaryContact: ClientContactRow | null;
  dazeDeviceCount: number;
  incompleteCount: number;
  hasRecentReminder: boolean;
}

/**
 * Minimal client for context/portal usage
 * Subset of fields needed for portal operations
 */
export interface ClientContext {
  id: string;
  name: string;
  phase: string;
  onboarding_progress: number | null;
  brand_palette: string[] | null;
  logo_url: string | null;
  legal_entity_name: string | null;
  billing_address: string | null;
  authorized_signer_name: string | null;
  authorized_signer_title: string | null;
}

/**
 * Legal entity fields extracted for reuse
 */
export interface LegalEntity {
  legal_entity_name: string | null;
  billing_address: string | null;
  authorized_signer_name: string | null;
  authorized_signer_title: string | null;
}

/**
 * Legal entity data for form submission (with undefined support)
 */
export interface LegalEntityFormData {
  property_name?: string;
  legal_entity_name?: string;
  billing_address?: string;
  authorized_signer_name?: string;
  authorized_signer_title?: string;
}
