/**
 * Venue-related type definitions
 * Centralized types for venue/restaurant data models
 */

import type { Tables } from "@/integrations/supabase/types";

// Core database type
export type VenueRow = Tables<"venues">;

/**
 * A single menu document attached to a venue
 */
export interface VenueMenu {
  id: string;
  venueId: string;
  fileUrl: string;
  fileName: string;
  label: string;
}

/**
 * UI venue with optional file attachments
 * Used in VenueCard component and portal forms
 */
export interface Venue {
  id: string;
  name: string;
  /** @deprecated Use menus array instead */
  menuFile?: File;
  /** @deprecated Use menus array instead */
  menuFileName?: string;
  /** @deprecated Use menus array instead */
  menuPdfUrl?: string;
  logoFile?: File;
  logoUrl?: string;
  additionalLogoUrl?: string;
  menus: VenueMenu[];
  colorPalette: string[];
}

/**
 * Venue update payload for mutations
 */
export interface VenueUpdate {
  name?: string;
  menuPdfUrl?: string | null;
  logoUrl?: string | null;
  additionalLogoUrl?: string | null;
  colorPalette?: string[];
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
  additional_logo_url: string | null;
  color_palette: string[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database venue_menus shape
 */
export interface DbVenueMenu {
  id: string;
  venue_id: string;
  file_url: string;
  file_name: string;
  label: string;
  created_at: string;
}
