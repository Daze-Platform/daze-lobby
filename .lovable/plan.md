

## Pre-populate Property Name for Springhill Suites Orange Beach + Admin Property Preset Feature

### Part 1: Hardcoded Pre-fill for Springhill Suites Orange Beach

The brand task for this client currently has empty data (`{}`). When the client opens the Brand Identity step, they see no properties and must add one manually. We'll pre-populate the property name so it's ready when they arrive.

**File: `src/components/portal/steps/BrandStep.tsx`**

In the `useState` initializer for `properties` (around line 113-149), after the check for saved properties and legacy data returns empty, add a fallback that checks the client name from context. Specifically, if the client slug is `springhill-suites-orange-beach` (or we can match by client name), initialize with one property named **"SpringHill Suites by Marriott Orange Beach Gulf Shores"** instead of returning an empty array.

This is a simple conditional at line ~149:
```
// If no saved data, check for known pre-fills
if (clientSlug === "springhill-suites-orange-beach") {
  return [{
    id: "property-default",
    name: "SpringHill Suites by Marriott Orange Beach Gulf Shores",
    logos: {},
    colors: ["#3B82F6"],
    isExpanded: true,
  }];
}
return [];
```

This requires importing `useClient` (already imported) and reading the client slug. We'll pull the slug from `ClientContext`.

**File: `src/contexts/ClientContext.tsx`** -- Verify that `client_slug` is available in the context. If not, add it so BrandStep can read it.

### Part 2: Admin Property Name Pre-fill from Control Tower

Currently, the Admin Venue Presets panel lets admins pre-add **venue** names. For **property/brand** names (used in Brand Identity step), there is no admin pre-fill mechanism yet.

**How to pre-fill today (manual approach):**
You can pre-fill the property name directly in the database. Run this in the backend SQL editor:

```sql
UPDATE onboarding_tasks 
SET data = jsonb_build_object(
  'properties', jsonb_build_array(
    jsonb_build_object(
      'id', 'property-' || floor(extract(epoch from now()) * 1000)::text,
      'name', 'SpringHill Suites by Marriott Orange Beach Gulf Shores',
      'logos', '{}'::jsonb,
      'colors', '["#3B82F6"]'::jsonb,
      'isExpanded', true
    )
  )
)
WHERE client_id = '53bd0e70-b268-488e-a947-6d520f516f50' 
  AND task_key = 'brand';
```

**For a UI-based approach (future enhancement):**
We could add an "Admin Property Presets" section in the Portal Management panel (similar to AdminVenuePresets) that lets admins pre-add property names which get written into the brand task data. This would be a separate feature if you'd like it built.

### Summary of Code Changes

1. **`src/contexts/ClientContext.tsx`** -- Expose `client_slug` in the context if not already available
2. **`src/components/portal/steps/BrandStep.tsx`** -- Add a pre-fill fallback for `springhill-suites-orange-beach` that initializes the property name to "SpringHill Suites by Marriott Orange Beach Gulf Shores"

This is a minimal, targeted change. The client will see the property name pre-populated when they open Brand Identity for the first time, but can still edit it.
