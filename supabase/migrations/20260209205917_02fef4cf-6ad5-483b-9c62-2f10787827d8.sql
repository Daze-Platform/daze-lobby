
-- Add client_code column
ALTER TABLE public.clients
  ADD COLUMN client_code text UNIQUE;

-- Create function to auto-generate sequential client code
CREATE OR REPLACE FUNCTION public.generate_client_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(client_code FROM 5) AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM public.clients
  WHERE client_code ~ '^CLT-\d+$';

  NEW.client_code := 'CLT-' || LPAD(next_num::text, 3, '0');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign client_code on insert
CREATE TRIGGER set_client_code
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  WHEN (NEW.client_code IS NULL)
  EXECUTE FUNCTION public.generate_client_code();
