
CREATE OR REPLACE FUNCTION public.check_onboarding_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
BEGIN
  -- Only run when a task is being marked as completed
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    -- Count total tasks and completed tasks for this client
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE is_completed = true)
    INTO total_tasks, completed_tasks
    FROM public.onboarding_tasks
    WHERE client_id = NEW.client_id;
    
    -- If all tasks are complete, transition client to 'reviewing' (In Review)
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
$function$;
