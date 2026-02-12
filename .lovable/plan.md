

# Auto-Route Client Users to Their Portal on Signup

## Overview

When an admin creates a new client and enters a primary contact email, that contact should be able to visit the portal URL, sign up with just a password (email pre-filled), verify their email, and land directly in their portal -- all seamlessly.

## Current Gap

The `handle_new_user()` trigger creates a profile and assigns a role, but it does **not** check `client_contacts` to auto-link the new user to their client. This means verified users land on a "No Hotel Assigned" dead-end.

## Changes

### 1. Database: Update `handle_new_user()` trigger

Add auto-linking logic at the end of the existing function:

- After creating the profile and assigning the role, look up `NEW.email` in `client_contacts`
- If a match is found, insert a row into `user_clients` mapping the new user to their client
- Uses `LOWER()` for case-insensitive matching and `ON CONFLICT DO NOTHING` for safety

This works for both email/password signups and Google OAuth since the trigger fires on any `auth.users` insert.

### 2. Frontend: Pre-fill email on the signup form via URL parameter

When the admin shares the portal URL, they can include the contact's email as a query parameter (e.g., `/portal/beachside-hotels?email=gm@hotel.com`).

**ClientLoginForm changes:**
- Read an `email` query parameter from the URL
- Pre-fill the email field and lock it (read-only) when present
- Auto-switch to "signup" mode when an email param is detected (since the user hasn't signed up yet)

### 3. Frontend: Auto-populate credentials after email verification

When the user clicks the verification link and returns to the app:

**ClientLoginForm changes:**
- Read a `verified` query parameter (set in the email redirect URL)
- When `verified=true` and an `email` param are present, show a success banner ("Email verified! Sign in below") and pre-fill the email field on the login form
- The user just enters their password and clicks Sign In

**SignUp redirect URL update:**
- Change the `emailRedirectTo` in the signup flow to include `verified=true&email=<their-email>` so that after clicking the verification link, the user returns to the portal login with their email pre-filled

### 4. Frontend: Update the "Copy URL" in NewClientModal

On Step 3 of the New Client wizard, update the copied URL to include the primary contact's email when available:

- If a contact with an email exists from Step 2, the "Copy" button generates: `/portal/<slug>?email=<primary-contact-email>`
- This is the URL the admin sends to the client contact

## End-to-End Flow

```text
1. Admin creates client "Beachside Hotels" with slug "beachside-hotels"
   and primary contact "gm@beachside.com"

2. Admin copies URL: /portal/beachside-hotels?email=gm@beachside.com
   and sends it to the contact

3. Contact opens the link:
   - Email field is pre-filled and read-only
   - Form is in "signup" mode
   - They enter their name + password, click "Create Account"

4. "Check your email" screen appears

5. Contact clicks verification link in email
   -> Redirects to: /portal/login?returnTo=/portal/beachside-hotels&verified=true&email=gm@beachside.com

6. Login form shows "Email verified!" banner, email pre-filled
   -> Contact enters password, clicks Sign In

7. handle_new_user() trigger already:
   - Created their profile
   - Assigned "client" role
   - Matched their email in client_contacts
   - Created user_clients row linking them to Beachside Hotels

8. PostAuth resolves their client_slug -> /portal/beachside-hotels
```

## Files Modified

- **Database migration**: Update `handle_new_user()` function with client_contacts email matching
- **`src/components/auth/ClientLoginForm.tsx`**: Read `email` and `verified` query params; pre-fill email; auto-switch to signup mode; show verification success banner
- **`src/components/modals/NewClientModal.tsx`**: Include primary contact email in the copied portal URL

## Edge Cases

- **No email param**: Form behaves exactly as it does today (no change for direct visitors)
- **Email not in contacts**: No `user_clients` row created; user sees "No Hotel Assigned" (expected for unknown signups)
- **Google OAuth**: Trigger handles it identically; email pre-fill is skipped since Google provides the email
- **Multiple contacts with same email**: `LIMIT 1` picks the first match
- **User already exists**: `ON CONFLICT DO NOTHING` prevents duplicate entries

