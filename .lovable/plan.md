

# Allow Public INSERT Access for Specifications Table

Update the RLS policy on the `specifications` table to allow your n8n workflow to insert data using the anon key.

---

## Current State

The existing INSERT policy restricts access to authenticated users with `admin` or `ops_manager` roles:

```text
CREATE POLICY "Admins and Ops Managers can create specifications"
  ON public.specifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ops_manager'));
```

---

## Proposed Change

Replace the INSERT policy with one that allows public/anon access:

```text
-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Admins and Ops Managers can create specifications" 
  ON public.specifications;

-- Create new policy allowing public INSERT access
CREATE POLICY "Allow public insert for specifications"
  ON public.specifications FOR INSERT
  WITH CHECK (true);
```

---

## Security Considerations

| Operation | Access Level |
|-----------|--------------|
| **SELECT** | Dashboard users only (unchanged) |
| **INSERT** | Public/anon access (for n8n integration) |
| **UPDATE** | Admins only (unchanged) |
| **DELETE** | Admins only (unchanged) |

This approach allows your external tool to insert specifications while keeping read/update/delete operations restricted to authorized users.

---

## After Implementation

Once the policy is updated, you can re-upload your Control Tower Dashboard specification via n8n, and I'll read it to build the Kanban Lifecycle View.

