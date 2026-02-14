

## Update Resend "From" Address to Verified Domain

### What Changes
Update the `send-alert-email` edge function to send emails from `notifications@dazeapp.com` instead of the default `onboarding@resend.dev`.

### Technical Details

**File: `supabase/functions/send-alert-email/index.ts`**
- Change the `from` field in the Resend API call from `"Daze <onboarding@resend.dev>"` to `"Daze <notifications@dazeapp.com>"`

After deploying, I will re-send the test email for "Daze Lobby" to confirm delivery works end-to-end.

