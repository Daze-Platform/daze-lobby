

# Create Specifications Table

A database table to store specification documents (like the Control Tower Dashboard blueprint) that can be referenced during development.

---

## Database Schema

### Table: specifications

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Specification title (e.g., "Control Tower Dashboard") |
| content | text | Full markdown content of the specification |
| version | text | Optional version identifier (e.g., "1.0", "2.1") |
| created_at | timestamp | When the spec was created |
| updated_at | timestamp | When the spec was last modified |
| created_by_id | uuid | User who created the specification |

---

## Security Policies (RLS)

| Role | Permissions |
|------|-------------|
| **Admin** | Full access (create, read, update, delete) |
| **Ops Manager** | Read and create specifications |
| **Support** | Read-only access |

---

## Migration SQL

```text
-- Create specifications table
CREATE TABLE public.specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  version text,
  created_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.specifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Dashboard users can view specifications"
  ON public.specifications FOR SELECT
  USING (has_dashboard_access(auth.uid()));

CREATE POLICY "Admins and Ops Managers can create specifications"
  ON public.specifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ops_manager'));

CREATE POLICY "Admins can update specifications"
  ON public.specifications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete specifications"
  ON public.specifications FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Auto-update timestamp trigger
CREATE TRIGGER update_specifications_updated_at
  BEFORE UPDATE ON public.specifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## After Creation

Once approved, you'll be able to upload your specification document to this table. I'll then read the latest entry to build the Kanban Lifecycle View according to your exact blueprint.

