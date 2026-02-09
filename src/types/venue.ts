/**
 * Venue-related type definitions
 * Centralized types for venue/restaurant data models
 */

import type { Tables } from "@/integrations/supabase/types";

// Core database type
export type VenueRow = Tables<"venues">;

/**
 * UI venue with optional file attachments
 * Used in VenueCard component and portal forms
 */
export interface Venue {
  id: string;
  name: string;
  menuFile?: File;
  menuFileName?: string;
  menuPdfUrl?: string;
  logoFile?: File;
  logoUrl?: string;
}

/**
 * Venue update payload for mutations
 */
export interface VenueUpdate {
  name?: string;
  menuPdfUrl?: string;
  logoUrl?: string;
}

/**
 * Database venue shape (returned from Supabase)
 */
export interface DbVenue {
  id: string;
  client_id: string;
  name: string;
  menu_pdf_url: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}
