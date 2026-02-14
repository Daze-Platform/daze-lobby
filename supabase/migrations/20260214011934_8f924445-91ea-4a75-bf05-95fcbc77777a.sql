
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function: notify on new property
CREATE OR REPLACE FUNCTION public.notify_new_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-alert-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := jsonb_build_object(
      'type', 'new_property',
      'details', jsonb_build_object(
        'name', NEW.name,
        'client_code', NEW.client_code,
        'id', NEW.id
      )
    )
  );
  RETURN NEW;
END;
$$;

-- Function: notify on agreement signed
CREATE OR REPLACE FUNCTION public.notify_agreement_signed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  SELECT name INTO v_client_name FROM public.clients WHERE id = NEW.client_id;
  
  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-alert-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := jsonb_build_object(
      'type', 'agreement_signed',
      'details', jsonb_build_object(
        'client_name', v_client_name,
        'client_id', NEW.client_id
      )
    )
  );
  RETURN NEW;
END;
$$;

-- Function: notify on device offline
CREATE OR REPLACE FUNCTION public.notify_device_offline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  SELECT name INTO v_client_name FROM public.clients WHERE id = NEW.client_id;
  
  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-alert-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := jsonb_build_object(
      'type', 'device_offline',
      'details', jsonb_build_object(
        'serial_number', NEW.serial_number,
        'device_type', NEW.device_type,
        'client_name', v_client_name,
        'client_id', NEW.client_id,
        'device_id', NEW.id
      )
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger: new property added
CREATE TRIGGER trg_notify_new_property
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_property();

-- Trigger: agreement signed (legal task completed)
CREATE TRIGGER trg_notify_agreement_signed
  AFTER UPDATE ON public.onboarding_tasks
  FOR EACH ROW
  WHEN (NEW.task_key = 'legal' AND NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL))
  EXECUTE FUNCTION public.notify_agreement_signed();

-- Trigger: device goes offline
CREATE TRIGGER trg_notify_device_offline
  AFTER UPDATE ON public.devices
  FOR EACH ROW
  WHEN (NEW.status = 'offline' AND OLD.status IS DISTINCT FROM 'offline')
  EXECUTE FUNCTION public.notify_device_offline();
