-- Add 'reviewing' to the lifecycle_phase enum
ALTER TYPE lifecycle_phase ADD VALUE IF NOT EXISTS 'reviewing' AFTER 'onboarding';

-- Create function to check onboarding completion and update hotel phase
CREATE OR REPLACE FUNCTION public.check_onboarding_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
BEGIN
  -- Only proceed if a task was just marked as completed
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    -- Count total and completed tasks for this hotel
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE is_completed = true)
    INTO total_tasks, completed_tasks
    FROM public.onboarding_tasks
    WHERE hotel_id = NEW.hotel_id;
    
    -- If all tasks are complete, update hotel phase to 'reviewing'
    IF total_tasks > 0 AND total_tasks = completed_tasks THEN
      UPDATE public.hotels
      SET phase = 'reviewing',
          phase_started_at = now(),
          onboarding_progress = 100
      WHERE id = NEW.hotel_id
        AND phase = 'onboarding';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on onboarding_tasks table
DROP TRIGGER IF EXISTS trigger_check_onboarding_completion ON public.onboarding_tasks;
CREATE TRIGGER trigger_check_onboarding_completion
  AFTER UPDATE ON public.onboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_onboarding_completion();