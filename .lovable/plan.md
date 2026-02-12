

# Security Hardening Plan

## Audit Summary

The security scan identified 9 findings across the project. After reviewing each one against the actual RLS policies and codebase, here are the actionable items prioritized by severity.

## Priority 1: Enable Leaked Password Protection (Critical)

Leaked password protection is currently disabled. This means users can sign up with passwords known to be compromised in data breaches (e.g., "password123"). This is a one-click configuration change in the backend auth settings.

**Action:** Enable leaked password protection via the auth configuration tool.

---

## Priority 2: Tighten Profile Visibility (High)

The current `profiles` SELECT policy allows any user within the same client organization to see colleagues' `two_factor_enabled` status and alert preferences. An attacker who compromises one client account could identify which colleagues lack 2FA -- making them phishing targets.

**Current policy (too broad for security fields):**
```sql
-- Users can see profiles of anyone in the same client
(user_id = auth.uid()) OR has_dashboard_access(...) OR EXISTS(shared client check)
```

**Fix:** Create a database view `profiles_public` that excludes security-sensitive columns (`two_factor_enabled`, alert preferences). Update client-facing queries to use the view. The full `profiles` table remains accessible only to the profile owner and dashboard users.

**Changes:**
- Migration: Create `profiles_public` view (excludes sensitive columns), with `security_invoker=on`
- No code changes needed -- the settings dialog already queries by `user_id = auth.uid()` which returns all columns for the owner

---

## Priority 3: Fix Message Sender Impersonation (High)

Dashboard users' INSERT policy only checks `has_dashboard_access(auth.uid()) AND (sender_id = auth.uid())`. This is actually correct -- the `sender_id = auth.uid()` clause prevents impersonation. However, the UPDATE policy allows dashboard users to update ANY message (not just their own), which could be used to alter message content.

**Fix:** Tighten the messages UPDATE policy so dashboard users can only update messages they sent, or only update the `is_read` field.

**Changes:**
- Migration: Replace the UPDATE policy to restrict dashboard users to only updating `is_read` on messages they didn't send

---

## Priority 4: Dismiss False Positives (Medium)

The automated scanner flagged several tables as "accessible without authentication," but reviewing the actual RLS policies shows they all require authentication:

- `documents`: Has RLS policies requiring `has_dashboard_access()` or client membership
- `user_roles`: Has policies requiring `has_role(auth.uid(), 'admin')` or `user_id = auth.uid()`
- `devices`: Has policies requiring `has_dashboard_access()` or role checks

These are false positives from the scanner and should be marked as resolved.

---

## Priority 5: Client Data Isolation Verification (High)

The most critical concern -- ensuring clients can never see another client's data. Here's the current state:

| Table | Isolation Method | Status |
|-------|-----------------|--------|
| clients | `user_clients` join check | Correct |
| onboarding_tasks | `user_clients` join check | Correct |
| documents | `user_clients` join check | Correct |
| messages | `user_clients` join check | Correct |
| client_contacts | `user_clients` join check | Correct |
| venues | `user_clients` join check | Correct |
| venue_menus | Joins through `venues` to `user_clients` | Correct |
| activity_logs | `user_clients` join check | Correct |

**Verdict:** Client data isolation is properly enforced at the database level. Each client can only access rows linked to their `client_id` via the `user_clients` mapping table.

---

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| Migration SQL | Create | `profiles_public` view + tighten messages UPDATE policy |
| Security findings | Update | Dismiss false positives, mark resolved items |

## What Won't Change

- No application code changes needed -- RLS policies handle isolation at the database layer
- No changes to the auth flow or 2FA implementation
- No schema changes to existing tables
- Client data isolation is already properly enforced

