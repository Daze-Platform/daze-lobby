

## Implement Email Alert System for Admins

### Overview
Build a backend function that sends email notifications to admins when key events occur: new property (client) added, agreement signed, or a device goes offline. The function respects each admin's alert preferences stored in the `profiles` table.

### Architecture

```text
Event (DB trigger on table)
  --> Calls backend function via pg_net
    --> Queries admin profiles for alert preferences
    --> Sends email via Resend API to opted-in admins
    --> Returns success/failure
```

### Step 1: Store the Resend API Key
- Use the `add_secret` tool to securely store `RESEND_API_KEY` as a backend secret.

### Step 2: Create the Edge Function
**New file: `supabase/functions/send-alert-email/index.ts`**

- Accepts a JSON payload: `{ type: "new_property" | "agreement_signed" | "device_offline", details: { ... } }`
- Validates the request (service-role or internal call only -- no JWT required, called from DB trigger via `pg_net`)
- Queries `profiles` joined with `user_roles` to find admins who have the corresponding alert enabled:
  - `type = "new_property"` checks `alert_new_property = true`
  - `type = "agreement_signed"` checks `alert_agreement_signed = true`
  - `type = "device_offline"` checks `alert_device_offline = true`
- Gets admin emails from `auth.users` via service role
- Sends emails via Resend API (`POST https://api.resend.com/emails`)
- Uses `from: "Daze <notifications@resend.dev>"` (or your verified domain)

### Step 3: Create Database Triggers
Three triggers that fire the edge function via `pg_net`:

| Trigger | Table | Event | Condition |
|---------|-------|-------|-----------|
| `notify_new_property` | `clients` | `AFTER INSERT` | Always (new client created) |
| `notify_agreement_signed` | `onboarding_tasks` | `AFTER UPDATE` | When `task_key = 'legal'` and `is_completed` changes to `true` |
| `notify_device_offline` | `devices` | `AFTER UPDATE` | When `status` changes to `'offline'` |

Each trigger calls a PL/pgSQL function that uses `net.http_post` to invoke the edge function with the event type and relevant details (client name, device serial, etc.).

### Step 4: Enable pg_net Extension
- Run migration to `CREATE EXTENSION IF NOT EXISTS pg_net` (required for DB-to-edge-function HTTP calls).

### Step 5: Update `supabase/config.toml`
- Add `[functions.send-alert-email]` with `verify_jwt = false` (called from DB trigger, not browser).

### Email Templates
Simple, clean HTML emails with:
- Daze branding header
- Event description (e.g., "New property 'Hotel XYZ' was just added")
- Timestamp
- Link to dashboard

### Security
- The edge function validates that calls come with the service role key (from `pg_net` which uses the service role automatically)
- No sensitive data exposed in emails
- Admin email addresses fetched server-side only

### Files Changed

| File | Action |
|------|--------|
| `supabase/functions/send-alert-email/index.ts` | **Create** -- Edge function to send emails via Resend |
| `supabase/config.toml` | **Update** -- Add function config |
| Database migration | **Create** -- pg_net extension + 3 trigger functions + 3 triggers |

