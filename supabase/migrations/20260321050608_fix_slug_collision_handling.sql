-- Fix "slug already taken" error when creating new clients
-- Root cause: Full UNIQUE constraint on client_slug includes soft-deleted clients,
-- and no collision handling (no numeric suffix appended for duplicate names).

-- Step 1: Drop the existing full UNIQUE constraint on client_slug
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_client_slug_key;

-- Step 2: Create a partial unique index that only applies to active (non-deleted) clients
CREATE UNIQUE INDEX IF NOT EXISTS clients_client_slug_active_unique
ON public.clients (client_slug)
WHERE deleted_at IS NULL;

-- Step 3: Replace the trigger function with collision-aware version
CREATE OR REPLACE FUNCTION public.set_client_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 0;
BEGIN
  -- Only generate if not provided
  IF NEW.client_slug IS NULL OR NEW.client_slug = '' THEN
    base_slug := public.generate_slug(NEW.name);
  ELSE
    base_slug := NEW.client_slug;
  END IF;

  candidate := base_slug;

  -- Loop until we find a slug not taken by any active (non-deleted) client
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.clients
      WHERE client_slug = candidate
        AND deleted_at IS NULL
        AND (TG_OP = 'INSERT' OR id IS DISTINCT FROM NEW.id)
    ) THEN
      NEW.client_slug := candidate;
      RETURN NEW;
    END IF;
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Step 4: Rename slugs on soft-deleted clients to free them up
UPDATE public.clients
SET client_slug = client_slug || '-deleted-' || EXTRACT(EPOCH FROM deleted_at)::int
WHERE deleted_at IS NOT NULL
  AND client_slug IS NOT NULL
  AND client_slug NOT LIKE '%-deleted-%';
