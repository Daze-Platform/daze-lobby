CREATE OR REPLACE FUNCTION public.check_client_inactivity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stale_task RECORD;
  hours_stale NUMERIC;
  severity_label TEXT;
  blocker_message TEXT;
  created_count INTEGER := 0;
BEGIN
  -- Find incomplete onboarding tasks older than 72 hours
  -- ONLY for clients that have at least 1 completed task (i.e., they've started onboarding)
  FOR stale_task IN
    SELECT ot.id AS task_id,
           ot.client_id,
           ot.task_name,
           ot.created_at,
           EXTRACT(EPOCH FROM (now() - ot.updated_at)) / 3600 AS hours_since_update
    FROM public.onboarding_tasks ot
    WHERE ot.is_completed = false
      AND ot.updated_at < (now() - interval '72 hours')
      -- Skip clients with 0 completed tasks (haven't started onboarding)
      AND EXISTS (
        SELECT 1 FROM public.onboarding_tasks ot2
        WHERE ot2.client_id = ot.client_id
          AND ot2.is_completed = true
      )
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
        auto_rule,
        task_id
      ) VALUES (
        stale_task.client_id,
        'automatic',
        blocker_message,
        'inactivity_watchdog:' || severity_label,
        stale_task.task_id
      );

      created_count := created_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('blockers_created', created_count);
END;
$function$;