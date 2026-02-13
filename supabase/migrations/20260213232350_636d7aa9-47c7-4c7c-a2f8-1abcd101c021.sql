
CREATE OR REPLACE FUNCTION public.merge_task_data(
  p_client_id uuid,
  p_task_key text,
  p_merge_data jsonb,
  p_remove_keys text[] DEFAULT '{}',
  p_mark_completed boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE onboarding_tasks
  SET
    data = (COALESCE(data, '{}'::jsonb) || p_merge_data) - p_remove_keys,
    is_completed = CASE WHEN p_mark_completed THEN true ELSE is_completed END,
    completed_at = CASE WHEN p_mark_completed THEN now() ELSE completed_at END,
    completed_by_id = CASE WHEN p_mark_completed THEN auth.uid() ELSE completed_by_id END
  WHERE client_id = p_client_id AND task_key = p_task_key;
END;
$$;
