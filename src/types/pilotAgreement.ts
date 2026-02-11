export interface PilotAgreementData {
  // Identity (existing fields)
  property_name?: string;
  legal_entity_name?: string;
  dba_name?: string;
  billing_address?: string;
  authorized_signer_name?: string;
  authorized_signer_title?: string;

  // New fields
  contact_email?: string;

  // Pilot Scope
  covered_outlets?: string[];
  hardware_option?: "none" | "daze_provided";
  num_tablets?: string;
  mounts_stands?: string;

  // Pilot Term
  start_date?: string;
  pilot_term_days?: number;

  // Pricing
  pricing_model?: "none" | "subscription" | "daze_rev_share" | "client_rev_share";
  pricing_amount?: string;

  // POS Integration
  pos_system?: string;
  pos_version?: string;
  pos_api_key?: string;
  pos_contact?: string;
}
