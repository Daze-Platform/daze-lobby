
# Activity Feed for Client Onboarding Portal (Preview)

## Current State

The **Portal Preview** page (`/portal-preview`) is intended to become the **Client Onboarding Portal** where hotel teams complete their onboarding tasks. Currently, it lacks the Activity Feed feature that was implemented in the main Portal page.

**Missing from PortalPreview.tsx:**
- No Clock icon button in the header
- No `ActivityFeedPanel` component imported or rendered
- No mobile Activity button in the bottom navigation
- No demo activity data to display (since there's no `hotelId`)

---

## Implementation Plan

### 1. Add Activity Feed Trigger UI to PortalPreview

**Desktop Header** (lines 154-180): Add a Clock icon button next to the existing "Reset Tour" and "Back to Login" buttons.

**Mobile Bottom Navigation** (lines 258-286): Add an "Activity" button with Clock icon alongside the existing "Reset" and "Login" buttons.

### 2. Import and Render ActivityFeedPanel

Add the `ActivityFeedPanel` component to the page with state management for open/close.

### 3. Create Demo Activity Data

Since the Preview Portal operates without authentication and has no real `hotelId`, I'll create a **local demo activity feed** that:
- Shows mock activity entries matching actions the user performs
- Updates in real-time as the user completes demo tasks
- Uses the same visual styling as the real feed

### 4. New Component: DemoActivityFeedPanel

Create a variant that accepts demo data instead of fetching from the database:

```text
File: src/components/portal/DemoActivityFeedPanel.tsx

Props:
  - open: boolean
  - onClose: () => void
  - activities: DemoActivity[]

DemoActivity interface:
  - id: string
  - action: string
  - userName: string
  - details?: Record<string, unknown>
  - timestamp: Date
```

### 5. Wire Up Demo Logging

Update the PortalPreview handlers to append entries to a local `demoActivities` state array:

| Handler | Log Entry |
|---------|-----------|
| `handleLegalSign` | `{ action: "legal_signed", userName: "Demo User", details: { signer_name } }` |
| `handleTaskUpdate` | `{ action: "task_completed", details: { task_name } }` |
| `handleFileUpload` | `{ action: "logo_uploaded", details: { file_name } }` |
| `handleVenuesSave` | `{ action: "venue_updated", details: { venue_count } }` |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/portal/DemoActivityFeedPanel.tsx` | **New** - Demo variant of ActivityFeedPanel |
| `src/components/portal/index.ts` | Export new component |
| `src/pages/PortalPreview.tsx` | Add Activity Feed button + panel + demo logging |

---

## UI Placement

```text
Desktop Header:
┌─────────────────────────────────────────────────────────────────┐
│  [Daze Logo] [Preview Badge]            [🔄 Reset] [🕐] [← Login] │
│                                                     ↑            │
│                                          Activity Feed button    │
└─────────────────────────────────────────────────────────────────┘

Mobile Bottom Nav:
┌─────────────────────────────────────────────────────────────────┐
│     [🔄 Reset]          [🕐 Activity]         [← Login]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

- The demo feed uses local React state instead of database queries
- Activity items are prepended (newest first) to match real behavior
- Timestamps use `new Date()` for relative time display ("just now", "2 minutes ago")
- The panel uses the same glassmorphism styling and Framer Motion animations
- Initial state includes 2-3 "seed" activities to demonstrate the feature when first opened
