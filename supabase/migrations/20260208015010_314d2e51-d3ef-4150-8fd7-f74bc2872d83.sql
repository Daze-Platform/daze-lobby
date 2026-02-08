-- Fix: Customer Contact Information Could Be Stolen
-- Restrict client_contacts SELECT access to admin and ops_manager only (remove support access)

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Dashboard users can view contacts" ON public.client_contacts;

-- Create a more restrictive policy that excludes support role from viewing PII
-- Only admin and ops_manager can view contact details (email, phone)
CREATE POLICY "Admins and Ops Managers can view contacts"
ON public.client_contacts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'ops_manager'::app_role)
);