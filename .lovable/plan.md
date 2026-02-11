

## Link Brian's Account to Daze Downtown Hotel

### Problem
Brian (`brian.92rod@hotmail.com`) has the correct `client` role, but has no record in the `user_clients` table linking him to any hotel. This causes the portal to redirect him to `/no-hotel-assigned`.

### Fix
Insert one row into `user_clients` to associate his user account with the "Daze Downtown Hotel" client.

### Technical Details

A single database migration will run:

```sql
INSERT INTO user_clients (user_id, client_id)
SELECT u.id, 'd88d4554-0153-4b82-97ba-50d579234450'
FROM auth.users u
WHERE u.email = 'brian.92rod@hotmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_clients uc
    WHERE uc.user_id = u.id
      AND uc.client_id = 'd88d4554-0153-4b82-97ba-50d579234450'
  );
```

This uses a safe subquery to avoid duplicates and to pull the user ID dynamically.

### Result
After this, when Brian logs into `/portal/daze-downtown-hotel`, his session will resolve to the Daze Downtown Hotel portal and he will see the onboarding flow.

### Files Changed
- None (database-only change)

