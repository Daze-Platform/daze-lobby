-- Backfill admin role for existing @dazeapp.com users who are missing it.
-- Root cause: handle_new_user trigger was not assigning admin roles when these
-- accounts were first created. The edge function generate-magic-link returns 403
-- for any user without admin/ops_manager in user_roles.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.email LIKE '%@dazeapp.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id
      AND ur.role IN ('admin', 'ops_manager')
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Also remove any 'client' role rows for @dazeapp.com team members
-- (they were incorrectly assigned client role by early trigger versions)
DELETE FROM public.user_roles
WHERE role = 'client'
  AND user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@dazeapp.com'
  );
