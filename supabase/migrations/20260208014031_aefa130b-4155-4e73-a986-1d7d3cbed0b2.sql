-- Fix: Users Can View Profiles Across All Clients
-- The current policy is too permissive - users can see profiles across all clients they have access to
-- We need to restrict it so users can only see profiles of users in the SAME client context

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view profiles for activity feed" ON public.profiles;

-- Create a more restrictive policy that properly scopes profile visibility
-- Users can view:
-- 1. Their own profile (user_id = auth.uid())
-- 2. Dashboard users can view all profiles (admins/ops/support)
-- 3. Clients can ONLY see profiles of users that share the SAME client_id as them
CREATE POLICY "Users can view profiles scoped to their client"
ON public.profiles
FOR SELECT
USING (
  user_id = auth.uid() 
  OR has_dashboard_access(auth.uid())
  OR (
    -- Client users can only see profiles of users who share at least one common client
    EXISTS (
      SELECT 1 
      FROM user_clients uc1
      JOIN user_clients uc2 ON uc1.client_id = uc2.client_id
      WHERE uc1.user_id = auth.uid() 
        AND uc2.user_id = profiles.user_id
    )
  )
);