-- Fix "slug already taken" error when creating new clients.
--
-- Root causes:
-- 1. The UNIQUE constraint on client_slug covers ALL rows, including
--    soft-deleted clients, so reusing a slug from a deleted client fails.
-- 2. The set_client_slug() trigger had no collision handling — two
--    clients with the same name would cause a unique-violation error.
--
-- This migration:
-- a) Drops any existing full UNIQUE constraint/index on client_slug.
-- b) Drops any redundant partial indexes from prior fix attempts.
-- c) Creates a single partial unique index scoped to active clients.
-- d) Rewrites set_client_slug() with collision-aware suffix logic.
-- e) Renames slugs on soft-deleted clients so they free up the namespace.

-- 1. Drop the existing full UNIQUE constraint on client_slug (if it exists)
DO $$
DECLARE
  _con text;
BEGIN
  SELECT conname INTO _con
    FROM pg_constraint
   WHERE conrelid = 'public.clients'::regclass
     AND contype = 'u'
     AND EXISTS (
       SELECT 1
         FROM unnest(conkey) AS k
         JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = k
        WHERE a.attname = 'client_slug'
     );
  IF _con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.clients DROP CONSTRAINT %I', _con);
  END IF;
END;
$$;

-- 2. Drop any lingering unique indexes on client_slug (from prior attempts)
DROP INDEX IF EXISTS public.idx_clients_slug_active;
DROP INDEX IF EXISTS public.clients_client_slug_active_unique;

-- Also drop any auto-created unique index from the original UNIQUE constraint
DO $$
DECLARE
  _idx text;
BEGIN
  FOR _idx IN
    SELECT i.relname
      FROM pg_index ix
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = ANY(ix.indkey)
     WHERE ix.indrelid = 'public.clients'::regclass
       AND ix.indisunique
       AND a.attname = 'client_slug'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', _idx);
  END LOOP;
END;
$$;

-- 3. Create ONE partial unique index — only active (non-deleted) clients
CREATE UNIQUE INDEX idx_clients_slug_active
  ON public.clients (client_slug)
  WHERE deleted_at IS NULL;

-- 4. Replace the trigger function with collision-aware version
CREATE OR REPLACE FUNCTION public.set_client_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 1;
BEGIN
  -- Only auto-generate if no slug was provided
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
    candidate := base_slug || '-' || suffix::text;
  END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 5. Rename slugs on soft-deleted clients so they stop blocking active slugs
UPDATE public.clients
   SET client_slug = client_slug || '-deleted-' || EXTRACT(EPOCH FROM deleted_at)::int
 WHERE deleted_at IS NOT NULL
   AND client_slug IS NOT NULL
   AND client_slug NOT LIKE '%-deleted-%';
