
# Automatic Role Assignment for Daze Team Members

## Overview

This plan adds automatic role assignment for users signing up with `@dazeapp.com` email addresses. When Brian (or any future Daze team member) signs up, they'll automatically receive the `admin` role and have full access to the Control Tower.

---

## Current State

The existing `handle_new_user()` database trigger only creates a profile entry:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;
```

---

## Implementation

### Modify the `handle_new_user()` Trigger

Add domain-based role assignment logic to the existing trigger:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for the new user
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Auto-assign admin role for @dazeapp.com team members
  IF NEW.email LIKE '%@dazeapp.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

## How It Works

| Email Domain | Role Assigned | Access Level |
|--------------|---------------|--------------|
| `@dazeapp.com` | `admin` | Full Control Tower access |
| Any other domain | None (manual assignment required) | No access until role assigned |

---

## What Brian Will Experience

1. Brian visits `/auth` and clicks "Sign in with Google"
2. He authenticates with `brian@dazeapp.com`
3. The database trigger fires automatically:
   - Creates his profile
   - Assigns the `admin` role
4. He's redirected to the dashboard with full access

---

## Security Considerations

- The trigger runs with `SECURITY DEFINER` privileges, allowing it to insert into `user_roles` regardless of RLS policies
- Email domain check happens server-side in PostgreSQL (cannot be spoofed from client)
- `ON CONFLICT DO NOTHING` prevents duplicate role entries if the user somehow triggers signup twice

---

## Database Changes

**Single migration** to update the `handle_new_user()` function - no new tables or columns needed.

---

## Future Flexibility

If you later want different roles for different domains or email patterns, the trigger can be extended:

```sql
-- Example future expansion
IF NEW.email LIKE '%@dazeapp.com' THEN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
ELSIF NEW.email LIKE '%@partner.com' THEN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'ops_manager');
END IF;
```
