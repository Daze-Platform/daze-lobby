

# Automated Onboarding Completion & Celebration

## Overview

This implementation will automate the status transition from 'Onboarding' to 'Reviewing' when all tasks are complete, notify admins, and show a celebration modal to clients.

## Current State Analysis

| Component | Current State |
|-----------|--------------|
| `hotels.phase` | Enum: `onboarding`, `pilot_live`, `contracted` |
| `onboarding_tasks.is_completed` | Boolean per task |
| Tasks | `legal`, `brand`, `venue` |
| Notifications | No table exists |
| Real-time | Not implemented for phase changes |

**Issue**: The current phase enum doesn't have a "reviewing" state. The status mapping treats `pilot_live` as "reviewing", but we need an explicit reviewing phase between onboarding and pilot_live.

---

## Implementation Plan

### Part 1: Database Changes

#### 1.1 Add "reviewing" to lifecycle_phase enum

```sql
ALTER TYPE lifecycle_phase ADD VALUE 'reviewing' AFTER 'onboarding';
```

New enum order: `onboarding` → `reviewing` → `pilot_live` → `contracted`

#### 1.2 Create notifications table

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning'
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admins can see all notifications
CREATE POLICY "Dashboard users can view notifications"
  ON notifications FOR SELECT
  USING (has_dashboard_access(auth.uid()) OR user_id = auth.uid());

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
```

#### 1.3 Create completion watchdog function and trigger

```sql
CREATE OR REPLACE FUNCTION check_onboarding_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hotel_id uuid;
  v_hotel_name text;
  v_total_tasks int;
  v_completed_tasks int;
  v_current_phase lifecycle_phase;
  v_admin_user_ids uuid[];
BEGIN
  v_hotel_id := NEW.hotel_id;
  
  -- Get current phase and hotel name
  SELECT phase, name INTO v_current_phase, v_hotel_name
  FROM hotels WHERE id = v_hotel_id;
  
  -- Only process if still in onboarding phase
  IF v_current_phase != 'onboarding' THEN
    RETURN NEW;
  END IF;
  
  -- Count total and completed tasks
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_completed = true)
  INTO v_total_tasks, v_completed_tasks
  FROM onboarding_tasks
  WHERE hotel_id = v_hotel_id;
  
  -- If all tasks are complete, transition to reviewing
  IF v_total_tasks > 0 AND v_completed_tasks = v_total_tasks THEN
    -- Update hotel phase
    UPDATE hotels
    SET 
      phase = 'reviewing',
      phase_started_at = now(),
      onboarding_progress = 100
    WHERE id = v_hotel_id;
    
    -- Get all admin/ops_manager user IDs
    SELECT array_agg(user_id) INTO v_admin_user_ids
    FROM user_roles
    WHERE role IN ('admin', 'ops_manager');
    
    -- Create notifications for all admins
    IF v_admin_user_ids IS NOT NULL THEN
      INSERT INTO notifications (user_id, hotel_id, title, message, type)
      SELECT 
        unnest(v_admin_user_ids),
        v_hotel_id,
        'Onboarding Complete',
        'Hotel "' || v_hotel_name || '" has completed onboarding and is ready for review.',
        'success';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on task completion
CREATE TRIGGER trigger_check_onboarding_completion
AFTER UPDATE OF is_completed ON onboarding_tasks
FOR EACH ROW
WHEN (NEW.is_completed = true AND OLD.is_completed = false)
EXECUTE FUNCTION check_onboarding_completion();
```

#### 1.4 Enable realtime for hotels table

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE hotels;
```

---

### Part 2: Frontend Implementation

#### 2.1 Update TypeScript types

Update `StatusBadge` and `useClientPortal` to handle the new "reviewing" status properly.

#### 2.2 Create CelebrationModal component

**File**: `src/components/portal/CelebrationModal.tsx`

```text
Features:
- Large green checkmark with animation
- Confetti effect (CSS-based or canvas)
- Headline: "All Set! Your profile is under review."
- Body message about team notification
- "Go to Dashboard" button (shows read-only state)
```

#### 2.3 Add real-time subscription for phase changes

**File**: `src/hooks/useClientPortal.ts`

```text
Changes:
- Subscribe to hotels table changes
- Detect when phase changes from 'onboarding' to 'reviewing'
- Trigger celebration modal via callback
```

#### 2.4 Update Portal page

**File**: `src/pages/Portal.tsx`

```text
Changes:
- Add CelebrationModal state
- Show read-only "Pending Review" state when phase is 'reviewing'
- Subscribe to real-time phase changes
- Show celebration when all tasks complete
```

#### 2.5 Update StatusBadge

**File**: `src/components/portal/StatusBadge.tsx`

```text
Changes:
- Add proper styling for "reviewing" status (amber/yellow theme)
- Map 'reviewing' phase correctly
```

---

### Part 3: File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add lifecycle_phase enum value, notifications table, trigger function |
| `src/integrations/supabase/types.ts` | Auto-update | Will reflect new enum and table |
| `src/components/portal/CelebrationModal.tsx` | Create | Success modal with confetti |
| `src/components/portal/StatusBadge.tsx` | Modify | Add reviewing status styling |
| `src/hooks/useClientPortal.ts` | Modify | Add real-time subscription, return phase info |
| `src/pages/Portal.tsx` | Modify | Add celebration modal, read-only reviewing state |
| `src/components/portal/index.ts` | Modify | Export CelebrationModal |

---

### Part 4: Celebration Modal Design

```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│           ✨  CONFETTI ANIMATION  ✨                │
│                                                     │
│                    ┌─────────┐                      │
│                    │    ✓    │   (Animated green    │
│                    │         │    checkmark)        │
│                    └─────────┘                      │
│                                                     │
│            "All Set! Your profile                   │
│              is under review."                      │
│                                                     │
│      Thanks for completing your setup.              │
│      Our team has been notified and                 │
│      will verify your details shortly.              │
│      You will be notified once your                 │
│      pilot is live.                                 │
│                                                     │
│          ┌──────────────────────┐                   │
│          │   Go to Dashboard    │                   │
│          └──────────────────────┘                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Part 5: Technical Details

#### Real-time Subscription Pattern

```typescript
// In useClientPortal or Portal.tsx
useEffect(() => {
  if (!hotelId) return;
  
  const channel = supabase
    .channel(`hotel-phase-${hotelId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'hotels',
        filter: `id=eq.${hotelId}`,
      },
      (payload) => {
        if (payload.new.phase === 'reviewing' && payload.old.phase === 'onboarding') {
          setShowCelebration(true);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [hotelId]);
```

#### Confetti Animation (CSS-based)

Using CSS keyframes for confetti particles that animate when the modal opens, no external library needed.

---

### Part 6: Post-Celebration State

When in "reviewing" phase:
- Show "Pending Review" status badge (amber styling)
- Tasks accordion becomes read-only (all checked, disabled)
- Progress ring shows 100%
- Message: "Your onboarding is complete! We're reviewing your setup."

