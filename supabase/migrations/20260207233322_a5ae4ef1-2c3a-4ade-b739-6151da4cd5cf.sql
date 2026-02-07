-- PHASE 1: Rename hotels table to clients
-- This is a comprehensive migration to pivot from "hotels" terminology to "clients"

-- Step 1: Rename the main table
ALTER TABLE public.hotels RENAME TO clients;

-- Step 2: Rename foreign key columns in related tables
ALTER TABLE public.blocker_alerts RENAME COLUMN hotel_id TO client_id;
ALTER TABLE public.client_hotels RENAME COLUMN hotel_id TO client_id;
ALTER TABLE public.devices RENAME COLUMN hotel_id TO client_id;
ALTER TABLE public.documents RENAME COLUMN hotel_id TO client_id;
ALTER TABLE public.hotel_contacts RENAME TO client_contacts;
ALTER TABLE public.client_contacts RENAME COLUMN hotel_id TO client_id;
ALTER TABLE public.onboarding_tasks RENAME COLUMN hotel_id TO client_id;
ALTER TABLE public.venues RENAME COLUMN hotel_id TO client_id;
ALTER TABLE public.activity_logs RENAME COLUMN hotel_id TO client_id;

-- Step 3: Update client_hotels table (the junction table for user-client assignments)
ALTER TABLE public.client_hotels RENAME TO user_clients;

-- Step 4: Recreate helper functions to use new naming
CREATE OR REPLACE FUNCTION public.can_access_client(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    has_dashboard_access(_user_id)
    OR
    EXISTS (
      SELECT 1 FROM public.user_clients
      WHERE user_id = _user_id AND client_id = _client_id
    )
$$;

CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT client_id
  FROM public.user_clients
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Step 5: Update the onboarding completion check trigger function
CREATE OR REPLACE FUNCTION public.check_onboarding_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
BEGIN
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE is_completed = true)
    INTO total_tasks, completed_tasks
    FROM public.onboarding_tasks
    WHERE client_id = NEW.client_id;
    
    IF total_tasks > 0 AND total_tasks = completed_tasks THEN
      UPDATE public.clients
      SET phase = 'reviewing',
          phase_started_at = now(),
          onboarding_progress = 100
      WHERE id = NEW.client_id
        AND phase = 'onboarding';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 6: Create messages table for Chat feature (two-way with clients)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Dashboard users can view all messages for any client
CREATE POLICY "Dashboard users can view all messages"
ON public.messages
FOR SELECT
USING (has_dashboard_access(auth.uid()));

-- Dashboard users can insert messages for any client
CREATE POLICY "Dashboard users can insert messages"
ON public.messages
FOR INSERT
WITH CHECK (has_dashboard_access(auth.uid()) AND sender_id = auth.uid());

-- Clients can view messages for their assigned client
CREATE POLICY "Clients can view their messages"
ON public.messages
FOR SELECT
USING (client_id IN (
  SELECT uc.client_id FROM public.user_clients uc WHERE uc.user_id = auth.uid()
));

-- Clients can insert messages for their assigned client
CREATE POLICY "Clients can insert messages"
ON public.messages
FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT uc.client_id FROM public.user_clients uc WHERE uc.user_id = auth.uid()
  ) AND sender_id = auth.uid()
);

-- Dashboard users and message owners can update messages (for is_read status)
CREATE POLICY "Users can update their own messages or dashboard can update any"
ON public.messages
FOR UPDATE
USING (sender_id = auth.uid() OR has_dashboard_access(auth.uid()));

-- Create index for efficient message lookups
CREATE INDEX idx_messages_client_id ON public.messages(client_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();