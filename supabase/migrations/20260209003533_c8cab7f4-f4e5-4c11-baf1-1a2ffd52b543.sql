-- Add logo_url column to venues table
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS logo_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.venues.logo_url IS 'URL of the venue logo stored in Supabase storage';