

# Add Editable Portal URL Field to New Client Flow

## What Changes

Add a new "Portal Access" section after the Team Contacts step (as a new Step 3) where the admin can review and customize the portal URL slug that will be shared with the client.

## Current Flow

```text
Step 1: Property Identity (name + POS)
Step 2: Team Contacts
--> Create Client
```

## New Flow

```text
Step 1: Property Identity (name + POS)
Step 2: Team Contacts
Step 3: Portal Access (URL slug editor)
--> Create Client
```

## How It Works

- The slug is auto-generated from the property name (already happens on line 81-85)
- In Step 3, the admin sees the full portal URL with an editable slug field
- The admin can accept the auto-generated slug or customize it
- The slug is validated: lowercase, alphanumeric + hyphens only, no empty value
- A "Copy URL" button lets the admin copy the full portal link for sharing
- On submit, the `client_slug` is passed in the `.insert()` call so it overrides the DB trigger's default

## No Database Changes Needed

The `clients` table already has a `client_slug` column, a `generate_slug()` function, and a trigger that auto-fills it on insert if not provided. Passing the slug explicitly in the insert will use the admin's customized value instead.

## File Changed

**`src/components/modals/NewClientModal.tsx`**

### State changes
- Change step type from `1 | 2` to `1 | 2 | 3`
- Add `customSlug` state initialized from `generatedSlug`
- Add `slugTouched` boolean to track if admin has manually edited

### Step indicator
- Update from 2 dots to 3 dots in the header progress bar

### Step 3 UI ("Portal Access")
- Section header with Link icon and description: "Customize the portal URL that will be shared with your client"
- Read-only base URL prefix (`/portal/`) with an editable slug input field
- Live preview of the full URL below
- Validation: slug must be non-empty, lowercase alphanumeric + hyphens, min 3 chars
- Copy URL button to copy the full portal link to clipboard

### Navigation updates
- Step 1 "Next" goes to Step 2 (unchanged)
- Step 2 "Next" goes to Step 3 (instead of creating the client)
- Step 3 "Back" goes to Step 2
- Step 3 "Create Client" submits the form

### Mutation update
- Pass `client_slug: customSlug` in the `.insert()` call to the `clients` table
- This overrides the trigger's auto-generated slug with the admin's chosen value

### Auto-sync behavior
- When `propertyName` changes and slug hasn't been manually edited, `customSlug` auto-updates from the generated slug
- Once the admin edits the slug field, auto-sync stops (manual override)

