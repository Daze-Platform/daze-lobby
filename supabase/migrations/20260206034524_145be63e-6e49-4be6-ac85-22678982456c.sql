-- Create a helper function to check if user is a client
CREATE OR REPLACE FUNCTION public.is_client(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'client'
  )
$$;

-- Create client_hotels table to link clients to their hotels
CREATE TABLE IF NOT EXISTS public.client_hotels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, hotel_id)
);

-- Enable RLS on client_hotels
ALTER TABLE public.client_hotels ENABLE ROW LEVEL SECURITY;

-- Clients can only see their own hotel links
CREATE POLICY "Clients can view their own hotel links"
ON public.client_hotels
FOR SELECT
USING (user_id = auth.uid());

-- Admins and Ops Managers can manage client-hotel links
CREATE POLICY "Admins and Ops Managers can manage client hotels"
ON public.client_hotels
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ops_manager'));

-- Create onboarding_tasks table to track client progress
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    task_key text NOT NULL,
    task_name text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    completed_by_id uuid,
    data jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(hotel_id, task_key)
);

-- Enable RLS on onboarding_tasks
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Clients can view and update their own hotel's tasks
CREATE POLICY "Clients can view their hotel tasks"
ON public.onboarding_tasks
FOR SELECT
USING (
    hotel_id IN (SELECT hotel_id FROM public.client_hotels WHERE user_id = auth.uid())
    OR has_dashboard_access(auth.uid())
);

CREATE POLICY "Clients can update their hotel tasks"
ON public.onboarding_tasks
FOR UPDATE
USING (
    hotel_id IN (SELECT hotel_id FROM public.client_hotels WHERE user_id = auth.uid())
)
WITH CHECK (
    hotel_id IN (SELECT hotel_id FROM public.client_hotels WHERE user_id = auth.uid())
);

-- Admins and Ops Managers can manage all tasks
CREATE POLICY "Admins and Ops Managers can manage all tasks"
ON public.onboarding_tasks
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ops_manager'));

-- Create storage bucket for client uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-uploads', 'client-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client uploads
CREATE POLICY "Clients can upload to their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'client-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Clients can view their own uploads"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'client-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all client uploads"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'client-uploads'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'ops_manager'))
);

-- Trigger to update updated_at
CREATE TRIGGER update_onboarding_tasks_updated_at
BEFORE UPDATE ON public.onboarding_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Re-enable RLS on specifications (was disabled for n8n, now use public INSERT policy instead)
ALTER TABLE public.specifications ENABLE ROW LEVEL SECURITY;