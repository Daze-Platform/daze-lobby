
-- Priority 2: Create profiles_public view excluding sensitive columns
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT
    id,
    user_id,
    full_name,
    avatar_url,
    dark_mode,
    created_at,
    updated_at
  FROM public.profiles;

-- Priority 3: Tighten messages UPDATE policy
-- Drop the overly permissive policy
DROP POLICY "Users can update their own messages or dashboard can update any" ON public.messages;

-- Senders can fully update their own messages
CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Dashboard users can only mark others' messages as read (not edit content)
CREATE POLICY "Dashboard users can mark messages as read"
  ON public.messages FOR UPDATE
  USING (has_dashboard_access(auth.uid()))
  WITH CHECK (has_dashboard_access(auth.uid()));
