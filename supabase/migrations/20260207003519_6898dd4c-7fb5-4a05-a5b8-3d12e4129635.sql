-- Add ownership tracking column to devices table
ALTER TABLE public.devices 
ADD COLUMN is_daze_owned BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.devices.is_daze_owned IS 
  'True if this is a Daze-provided tablet, false if client-owned device';