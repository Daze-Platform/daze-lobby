
-- Add client_slug column
ALTER TABLE public.clients ADD COLUMN client_slug text UNIQUE;

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(trim(input_text), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Trigger to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION public.set_client_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_slug IS NULL OR NEW.client_slug = '' THEN
    NEW.client_slug := public.generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_set_client_slug
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_client_slug();

-- Backfill existing clients
UPDATE public.clients SET client_slug = public.generate_slug(name) WHERE client_slug IS NULL;
