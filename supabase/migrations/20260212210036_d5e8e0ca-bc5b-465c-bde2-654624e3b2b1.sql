
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  matched_client_id UUID;
BEGIN
  -- Create profile for the new user
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  IF NEW.email LIKE '%@dazeapp.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Auto-link to client if email matches a contact
  SELECT client_id INTO matched_client_id
  FROM public.client_contacts
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;

  IF matched_client_id IS NOT NULL THEN
    INSERT INTO public.user_clients (user_id, client_id)
    VALUES (NEW.id, matched_client_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
