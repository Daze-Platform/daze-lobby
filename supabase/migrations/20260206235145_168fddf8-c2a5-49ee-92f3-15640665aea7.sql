-- Drop existing restrictive policies on activity_logs
DROP POLICY IF EXISTS "Dashboard users can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Dashboard users can create activity logs" ON activity_logs;

-- Create new policies that include client access
CREATE POLICY "Users can view activity logs for their hotel"
ON activity_logs FOR SELECT
TO authenticated
USING (
  hotel_id IN (
    SELECT hotel_id FROM client_hotels
    WHERE user_id = auth.uid()
  )
  OR has_dashboard_access(auth.uid())
);

CREATE POLICY "Users can create activity logs for their hotel"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (
  (hotel_id IN (
    SELECT hotel_id FROM client_hotels
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid())
  OR (has_dashboard_access(auth.uid()) AND user_id = auth.uid())
);

-- Drop existing restrictive policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create new policy that allows clients to view profiles for activity feed
CREATE POLICY "Users can view profiles for activity feed"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Users in the same hotel as the current user
  user_id IN (
    SELECT ch.user_id FROM client_hotels ch
    WHERE ch.hotel_id IN (
      SELECT hotel_id FROM client_hotels
      WHERE user_id = auth.uid()
    )
  )
  OR user_id = auth.uid()
  OR has_dashboard_access(auth.uid())
);