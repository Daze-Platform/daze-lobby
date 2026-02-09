

# Add Sequential Client ID (CLT-001) to New Client Flow

## Overview
Add an auto-generated, human-readable sequential ID (e.g. `CLT-001`, `CLT-002`) to every client created through the admin "New Client" modal. This ID will be stored in a new `client_code` column on the `clients` table and displayed in the UI.

## Technical Details

### 1. Database Migration
Add a `client_code` column to the `clients` table:
```sql
ALTER TABLE public.clients
  ADD COLUMN client_code text UNIQUE;
```

Create a database function that auto-generates the next sequential code on insert:
```sql
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

CREATE TRIGGER set_client_code
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  WHEN (NEW.client_code IS NULL)
  EXECUTE FUNCTION public.generate_client_code();
```

This ensures:
- Codes are auto-assigned (CLT-001, CLT-002, ...) whenever a client is created without specifying one
- The trigger only fires when `client_code` is NULL, allowing manual overrides if needed
- Codes go beyond 999 naturally (CLT-1000, etc.)

### 2. Backfill Existing Clients
Run a one-time data update to assign codes to any existing clients (ordered by creation date):
```sql
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM clients WHERE client_code IS NULL
)
UPDATE clients SET client_code = 'CLT-' || LPAD(rn::text, 3, '0')
FROM numbered WHERE clients.id = numbered.id;
```

### 3. Frontend Changes

**`src/components/modals/NewClientModal.tsx`**
- No changes needed -- the trigger auto-generates the code on insert

**`src/components/kanban/HotelCard.tsx`** (or wherever client cards are rendered)
- Display the `client_code` badge alongside the client name (e.g. a small muted badge showing "CLT-001")

**`src/types/client.ts`**
- Add `client_code: string | null` to the `Client` interface (it will come from the DB row type automatically after migration, but ensure it's referenced)

**`src/components/dashboard/ClientDetailPanel.tsx`**
- Show the client code in the detail panel header

### 4. Query Updates
Any query selecting from `clients` that needs the code (Kanban board, client detail, admin client list) should include `client_code` in the select. The main queries in `useClients.ts` and `ClientContext.tsx` will be updated to include this field.

