-- Add Legal Entity fields to the 'hotels' table
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS legal_entity_name TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS authorized_signer_name TEXT,
ADD COLUMN IF NOT EXISTS authorized_signer_title TEXT;