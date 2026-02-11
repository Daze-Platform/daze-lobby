
-- Add task_id column to blocker_alerts so we can link watchdog blockers to specific tasks
ALTER TABLE public.blocker_alerts
ADD COLUMN task_id uuid REFERENCES public.onboarding_tasks(id) ON DELETE CASCADE;

-- Create index for fast lookups when checking if a blocker already exists for a task
CREATE INDEX idx_blocker_alerts_task_id ON public.blocker_alerts(task_id) WHERE task_id IS NOT NULL;

-- Create the inactivity watchdog RPC function
CREATE OR REPLACE FUNCTION public.check_client_inactivity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stale_task RECORD;
  hours_stale NUMERIC;
  severity_label TEXT;
  blocker_message TEXT;
  created_count INTEGER := 0;
BEGIN
  -- Find incomplete onboarding tasks older than 72 hours
  FOR stale_task IN
    SELECT ot.id AS task_id,
           ot.client_id,
           ot.task_name,
           ot.created_at,
           EXTRACT(EPOCH FROM (now() - ot.updated_at)) / 3600 AS hours_since_update
    FROM public.onboarding_tasks ot
    WHERE ot.is_completed = false
      AND ot.updated_at < (now() - interval '72 hours')
  LOOP
    -- Check if a blocker already exists for this task (unresolved)
    IF NOT EXISTS (
      SELECT 1 FROM public.blocker_alerts ba
      WHERE ba.task_id = stale_task.task_id
        AND ba.resolved_at IS NULL
    ) THEN
      -- Determine severity based on staleness
      hours_stale := stale_task.hours_since_update;
      IF hours_stale > 120 THEN
        severity_label := 'high';
      ELSE
        severity_label := 'medium';
      END IF;

      blocker_message := 'Client has been stuck on task "' || stale_task.task_name || '" for ' || ROUND(hours_stale)::text || '+ hours.';

      INSERT INTO public.blocker_alerts (
        client_id,
        blocker_type,
        reason,
        auto_rule
      ) VALUES (
        stale_task.client_id,
        'automatic',
        blocker_message,
        'inactivity_watchdog:' || severity_label
      );

      created_count := created_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('blockers_created', created_count);
END;
$$;
