

# Bulletproof Portal URL Routing in New Client Wizard

## Problem

The Portal Access step (Step 3) of the New Client wizard has several gaps that could cause routing failures or confusing errors:

1. **No duplicate slug detection** -- The database enforces uniqueness on `client_slug`, but the UI doesn't check beforehand. If a slug is already taken, the user gets a generic "Failed to create client" error with no explanation.
2. **No reserved word protection** -- A user could enter `login` as a slug, creating a client at `/portal/login` which conflicts with the actual login route.
3. **Weak slug formatting** -- The current regex (`/^[a-z0-9-]+$/`) allows invalid patterns like `---`, `-my-hotel`, or `hotel-` (leading/trailing hyphens).
4. **No availability feedback** -- Users cannot tell if a slug is available until they attempt submission.

## Solution

### 1. Real-Time Slug Uniqueness Check

Add a debounced query that checks if the entered slug already exists in the `clients` table. Display inline feedback:
- A green checkmark and "Available" label when the slug is unique
- A red warning and "Already taken" label when it conflicts

This uses a simple `supabase.from("clients").select("id").eq("client_slug", slug).maybeSingle()` call, debounced by ~500ms to avoid excessive queries while typing.

### 2. Reserved Slug Blocklist

Define a list of reserved words that conflict with existing routes:
- `login`, `admin`, `signup`, `auth`, `settings`, `api`, `dashboard`, `post-auth`

If the user enters a reserved slug, show a validation message: "This URL is reserved. Please choose a different slug."

### 3. Stricter Slug Validation

Tighten the regex to enforce proper formatting:
- Must start and end with a letter or number (no leading/trailing hyphens)
- No consecutive hyphens (`--`)
- Minimum 3 characters, maximum 60 characters
- Pattern: `/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/` (with length check)

### 4. Better Error Handling on Insert Failure

Catch the specific unique constraint violation error (`23505`) from the database and display a clear message: "This portal URL is already in use. Please choose a different one." This acts as a safety net in case the real-time check misses a race condition.

## Technical Details

### Files Changed

| File | Action |
|------|--------|
| `src/components/modals/NewClientModal.tsx` | Update -- add slug validation, uniqueness check, reserved words, better error handling |

### Changes to `NewClientModal.tsx`

**Add constants at the top:**
- `RESERVED_SLUGS` array containing route-conflicting words
- Updated slug validation regex

**Add a debounced uniqueness check:**
- New state: `slugStatus` ("idle" / "checking" / "available" / "taken")
- `useEffect` with a 500ms debounce that queries the database when `customSlug` changes and is valid
- Query: `supabase.from("clients").select("id").eq("client_slug", customSlug).maybeSingle()`

**Update the slug input UI (Step 3):**
- Show a spinner icon while checking availability
- Show a green check + "Available" when confirmed unique
- Show a red X + "Already taken" when a conflict is found
- Show "Reserved URL" warning for blocklisted slugs

**Update validation logic:**
- `isSlugValid` now also checks: not reserved, no leading/trailing hyphens, no consecutive hyphens, max length
- "Create Client" button disabled when slug is taken, reserved, or still checking

**Improve error handling in `createClientMutation`:**
- In `onError`, check for Postgres error code `23505` (unique violation) and display a specific toast: "This portal URL is already in use"
- Reset `slugStatus` to "taken" so the UI reflects the conflict

