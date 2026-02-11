

## Fix Portal Greeting to Show Logged-in User's Name

### Problem
The portal greeting ("Your Portal / [wave] Name") currently pulls from the `client_contacts` table (primary contact record), not from the logged-in user's profile. This means:
- It shows "Brian Rodriguez" instead of "Andres Diaz" (the name he signed up with)
- Any new user who signs up will see the primary contact's name, not their own

### Changes

**1. Database: Update contact name**

Update the existing primary contact record to reflect the correct name:

```sql
UPDATE client_contacts 
SET name = 'Andres Diaz' 
WHERE id = '4db9aeb4-169c-45c5-8763-69afc931e446';
```

**2. `src/pages/Portal.tsx` -- Use the logged-in user's profile name for the greeting**

Replace the `primaryContact` query and `primaryFirstName` logic with the user's own profile name. The `user` object from `useAuthContext()` already contains `fullName` (loaded from the `profiles` table).

Change line 270 from:
```
{isAdminViewingPortal ? (client?.name || "Partner") : (primaryFirstName || "Partner")}
```
to:
```
{isAdminViewingPortal ? (client?.name || "Partner") : (user?.fullName?.split(" ")[0] || "Partner")}
```

Remove the now-unused `primaryContact` query (lines 56-69) and the `primaryFirstName` variable (line 71) to keep the code clean.

### Result
- Andres will see "Andres" in the greeting immediately
- Any future client user who signs up with their name will see their own first name in the portal greeting, not the primary contact's name
- Admin view continues showing the hotel/client name as before

### Files Changed
- `src/pages/Portal.tsx`
- Database update (one row in `client_contacts`)
