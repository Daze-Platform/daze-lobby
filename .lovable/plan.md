

# Remove Mock Data and Add Admin Activity Logging

## Overview
Replace mock contacts and activity data in the Client Detail Panel with real database queries, and add activity logging to admin actions (document uploads, reminders) so they appear in both the admin and client-facing activity feeds.

## Changes

### 1. Contacts Tab -- Use Real Data (`ClientDetailPanel.tsx`)
- Remove the `MockContact` interface and `mockContacts` array
- Query the `client_contacts` table for the selected client using `useQuery`
- Update `ContactCard` to accept a `ClientContactRow` type (from Supabase types) instead of `MockContact`
- Show a loading state and an empty state when no contacts exist

### 2. Activity Tab -- Use Real Data (`ClientDetailPanel.tsx`)
- Remove the `MockActivity` interface and `mockActivity` array
- Import and use the existing `useActivityLogs(hotel.id)` hook (already built and working)
- Replace the `ActivityItem` component with one that consumes the real `ActivityLog` type (or reuse the one from `ActivityFeedPanel.tsx`)
- Show loading skeleton and empty state
- Activity will auto-refresh every 30 seconds (already built into the hook)

### 3. Log Activity on Admin Document Uploads (`AdminDocumentUpload.tsx`)
- Import `useLogActivity` and call it on successful upload with action `"document_uploaded"` and details including the document type and title
- Also log on document deletion with action `"document_deleted"`

### 4. Add Admin Actions to Activity Feed Display
- Update the `getActionConfig` mapping in `ActivityFeedPanel.tsx` to include the new admin actions: `document_uploaded`, `document_deleted`
- Update the `formatAction` function in the same file to render human-readable text for these new actions

### 5. Cleanup
- Remove all mock data interfaces and arrays (`MockContact`, `MockActivity`, `mockContacts`, `mockActivity`)
- Remove unused icon imports that were only needed for mock activity rendering (if the real activity component handles its own icons)

## Technical Details

**Contacts query** (new in `ClientDetailPanel.tsx`):
```typescript
const { data: contacts = [], isLoading: contactsLoading } = useQuery({
  queryKey: ["client-contacts", hotel?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("client_contacts")
      .select("*")
      .eq("client_id", hotel!.id)
      .order("is_primary", { ascending: false });
    if (error) throw error;
    return data;
  },
  enabled: !!hotel?.id && open,
});
```

**Activity** will reuse the existing `useActivityLogs` hook which already fetches from the `activity_logs` table with profile joins and 30-second polling.

**Admin logging** will use `useLogActivity` in `AdminDocumentUpload.tsx`, calling `logActivity.mutate()` on successful upload/delete. Since admin users have `has_dashboard_access`, the existing RLS INSERT policy allows this (the policy also checks `user_id = auth.uid()`).

