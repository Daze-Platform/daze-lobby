-- Add preferences columns to profiles table for settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dark_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_new_property boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_agreement_signed boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_device_offline boolean DEFAULT true;