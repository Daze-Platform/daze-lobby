

# Activity Feed Refinement for Client Portal

## Problem Analysis

The Activity Feed was implemented with the UI components in place, but there are **three critical gaps** preventing it from working for hotel teams (client users):

### Issue 1: RLS Policies Block Client Access
The `activity_logs` table has policies that only allow **dashboard users** (admins, ops_managers, support) to view and create logs:

```sql
-- Current SELECT policy
has_dashboard_access(auth.uid())  -- Clients cannot see logs!

-- Current INSERT policy  
has_dashboard_access(auth.uid()) AND (user_id = auth.uid())  -- Clients cannot create logs!
```

### Issue 2: No Activity Logging in Client Portal
The `useClientPortal` hook performs all the key actions (signing agreements, uploading logos, saving venues, completing tasks) but **never inserts records** into the `activity_logs` table.

### Issue 3: Profiles RLS Blocks User Name Lookup
The profiles table also restricts SELECT to `has_dashboard_access(auth.uid())`, so even if activity logs were accessible, the join to fetch user names would fail for clients.

---

## Implementation Plan

### 1. Database Migration: Fix RLS Policies

**Activity Logs - New Policies:**
```sql
-- Allow clients to view activity logs for their assigned hotel
CREATE POLICY "Clients can view their hotel activity logs"
ON activity_logs FOR SELECT
TO authenticated
USING (
  hotel_id IN (
    SELECT hotel_id FROM client_hotels
    WHERE user_id = auth.uid()
  )
  OR has_dashboard_access(auth.uid())
);

-- Allow clients to create activity logs for their hotel
CREATE POLICY "Clients can create activity logs for their hotel"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (
  (hotel_id IN (
    SELECT hotel_id FROM client_hotels
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid())
  OR (has_dashboard_access(auth.uid()) AND user_id = auth.uid())
);
```

**Profiles - New Policy:**
```sql
-- Allow clients to view profiles (for activity feed user names)
CREATE POLICY "Clients can view profiles for activity feed"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Users in the same hotel as the current user
  user_id IN (
    SELECT ch.user_id FROM client_hotels ch
    WHERE ch.hotel_id IN (
      SELECT hotel_id FROM client_hotels
      WHERE user_id = auth.uid()
    )
  )
  OR user_id = auth.uid()
  OR has_dashboard_access(auth.uid())
);
```

### 2. New Utility Hook: `useLogActivity`

Create a reusable hook that handles activity logging with proper error handling:

**File:** `src/hooks/useLogActivity.ts`

```tsx
export function useLogActivity(hotelId: string | null) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      action, 
      details 
    }: { 
      action: string; 
      details?: Record<string, unknown>;
    }) => {
      if (!hotelId || !user?.id) return;
      
      await supabase.from("activity_logs").insert({
        hotel_id: hotelId,
        user_id: user.id,
        action,
        details,
        is_auto_logged: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["activity-logs", hotelId] 
      });
    },
  });
}
```

### 3. Integrate Activity Logging into `useClientPortal`

Add activity logging calls to each major mutation:

| Action | Log Entry |
|--------|-----------|
| `signLegalMutation.onSuccess` | `{ action: "legal_signed", details: { signer_name } }` |
| `updateTaskMutation.onSuccess` | `{ action: "task_completed", details: { task_name: taskKey } }` |
| `uploadLogoMutation.onSuccess` | `{ action: "logo_uploaded", details: { variant } }` |
| `saveVenuesMutation.onSuccess` | `{ action: "venue_updated", details: { venue_count } }` |
| `uploadVenueMenuMutation.onSuccess` | `{ action: "menu_uploaded", details: { venue_name } }` |

**Example Integration:**

```tsx
const signLegalMutation = useMutation({
  // ... existing mutation code
  onSuccess: (data, variables) => {
    queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
    
    // Log activity
    logActivity.mutate({
      action: "legal_signed",
      details: { 
        signer_name: variables.legalEntityData?.authorized_signer_name 
      },
    });
    
    toast.success("Agreement signed successfully!");
  },
});
```

### 4. Enhance Action Mapping in `ActivityFeedPanel`

Add POS integration actions to the icon/color mapping:

```tsx
const configs = {
  // ... existing configs
  pos_provider_selected: { 
    icon: Settings, 
    color: "text-accent-orange", 
    bgColor: "bg-accent-orange/10" 
  },
  pos_instructions_copied: { 
    icon: Copy, 
    color: "text-accent-orange", 
    bgColor: "bg-accent-orange/10" 
  },
  pos_sent_to_it: { 
    icon: Send, 
    color: "text-emerald-500", 
    bgColor: "bg-emerald-500/10" 
  },
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database | Add RLS policies for client access to `activity_logs` and `profiles` |
| `src/hooks/useLogActivity.ts` | **New file** - Reusable activity logging hook |
| `src/hooks/useClientPortal.ts` | Add activity logging to all mutation success handlers |
| `src/components/portal/ActivityFeedPanel.tsx` | Add new action type mappings for POS and brand actions |
| `src/components/portal/steps/PosStep.tsx` | Add activity logging for provider selection and IT instructions |

---

## Activity Log Action Types

Full mapping of actions that will be logged:

| Action Key | Description | Trigger Point |
|------------|-------------|---------------|
| `legal_signed` | Pilot Agreement signed | Legal step completion |
| `task_completed` | Generic task completion | Any task marked complete |
| `brand_updated` | Brand palette saved | Color picker save |
| `logo_uploaded` | Logo variant uploaded | Logo upload success |
| `venue_created` | New venue added | Venue save (first time) |
| `venue_updated` | Venue details changed | Venue save (updates) |
| `menu_uploaded` | Menu PDF uploaded | Menu upload success |
| `pos_provider_selected` | POS provider chosen | Provider card selection |
| `pos_sent_to_it` | Instructions sent to IT | Mark as Sent button |

---

## Expected Outcome

After implementation, hotel team members will see:

```text
┌────────────────────────────────────────┐
│  [Clock Icon] Activity Feed            │
│  ──────────────────────────────────────│
│                                        │
│  [Avatar] Jane Smith                   │
│  signed the Pilot Agreement            │
│  2 hours ago                           │
│  ────────────────────────────────────  │
│  [Avatar] Mike Chen                    │
│  uploaded a logo                       │
│  5 hours ago                           │
│  ────────────────────────────────────  │
│  [Avatar] Jane Smith                   │
│  created venue "The Rooftop Bar"       │
│  Yesterday                             │
│                                        │
└────────────────────────────────────────┘
```

