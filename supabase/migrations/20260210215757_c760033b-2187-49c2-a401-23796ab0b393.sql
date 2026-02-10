
-- Create a trigger function that updates onboarding_progress based on completed tasks
CREATE OR REPLACE FUNCTION public.update_onboarding_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  new_progress INTEGER;
BEGIN
  -- Count total and completed tasks for this client
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_completed = true)
  INTO total_tasks, completed_tasks
  FROM public.onboarding_tasks
  WHERE client_id = NEW.client_id;

  -- Calculate percentage (avoid division by zero)
  IF total_tasks > 0 THEN
    new_progress := ROUND((completed_tasks::numeric / total_tasks::numeric) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Update the client's onboarding_progress
  UPDATE public.clients
  SET onboarding_progress = new_progress
  WHERE id = NEW.client_id;

  RETURN NEW;
END;
$$;

-- Trigger on every insert/update/delete of onboarding_tasks
CREATE TRIGGER update_client_onboarding_progress
AFTER INSERT OR UPDATE OR DELETE ON public.onboarding_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_onboarding_progress();
