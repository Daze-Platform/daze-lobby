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