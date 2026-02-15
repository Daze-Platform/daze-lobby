
CREATE OR REPLACE FUNCTION public.guard_duplicate_activity_log()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip if a duplicate exists within the last 5 seconds
  IF EXISTS (
    SELECT 1 FROM public.activity_logs
    WHERE client_id = NEW.client_id
      AND action = NEW.action
      AND COALESCE(user_id, '00000000-0000-0000-0000-000000000000') = COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000')
      AND details::text IS NOT DISTINCT FROM NEW.details::text
      AND created_at > (now() - interval '5 seconds')
  ) THEN
    RETURN NULL; -- suppress the insert
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_duplicate_activity_log
BEFORE INSERT ON public.activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.guard_duplicate_activity_log();
