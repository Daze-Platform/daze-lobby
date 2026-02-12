

# Fix Logo Display and Toast in Client Detail Panel

## Problem
When an admin uploads a logo via the pencil icon on the client detail panel header, two issues occur:
1. The avatar does not visually update until the panel is closed and reopened, because it reads directly from the `hotel` prop which may not re-render immediately after cache invalidation.
2. The toast notification uses the Radix toast system (`@/hooks/use-toast`) instead of the project-standard `sonner`, which may not display visibly depending on which `<Toaster>` is mounted.

## Changes

### `src/components/dashboard/ClientDetailPanel.tsx`

**Toast fix:**
- Replace `import { toast } from "@/hooks/use-toast"` (line 37) with `import { toast } from "sonner"`
- Update `onSuccess` toast call from `toast({ title: "...", description: "..." })` to `toast.success("Logo updated")`
- Update `onError` toast call to `toast.error("Failed to upload logo")`

**Instant avatar update:**
- Add a local `logoUrl` state initialized from `hotel.logo_url`
- Sync it via `useEffect` when `hotel.logo_url` changes (covers cache refresh)
- In `logoUpload.onSuccess`, set local state immediately with the returned `publicUrl` for instant feedback
- Replace `hotel.logo_url` in the `<AvatarImage>` with the local `logoUrl` state

### No other files need changes
The `AdminBrandPosControls` component already uses sonner and invalidates the correct query key.

