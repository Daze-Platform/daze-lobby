-- Fix: "Customer Contact Information Could Be Stolen"
-- Add policy allowing clients to view contacts for their own assigned client
-- This adds client-scoped access in addition to existing admin/ops policies

CREATE POLICY "Clients can view their own client contacts"
ON public.client_contacts
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT uc.client_id
    FROM public.user_clients uc
    WHERE uc.user_id = auth.uid()
  )
);