

# Fix: Clients Sidebar Link Not Working in Recently Deleted View

## Problem

When viewing "Recently Deleted" on the Clients page, clicking the "Clients" sidebar link does nothing because:
- You're already on `/clients`
- React Router's NavLink skips navigation to the current route
- The `showDeleted` state is local React state, so it stays `true`

## Solution

Move `showDeleted` from local `useState` to a URL search parameter (`?view=deleted`). This way:
- Clicking "Clients" in the sidebar navigates to `/clients` (no query param), which naturally exits the deleted view
- The deleted view becomes bookmarkable and shareable
- Browser back/forward works correctly with the toggle

## Changes

### File: `src/pages/Clients.tsx`

- Replace `useState(false)` for `showDeleted` with `useSearchParams`
- Derive `showDeleted` from `searchParams.get("view") === "deleted"`
- Update the "Recently Deleted" toggle button to set/clear the `?view=deleted` search param instead of calling `setShowDeleted`

**Before:**
```
const [showDeleted, setShowDeleted] = useState(false);
```

**After:**
```
const [searchParams, setSearchParams] = useSearchParams();
const showDeleted = searchParams.get("view") === "deleted";
```

Toggle button update:
```
onClick={() => {
  if (showDeleted) {
    searchParams.delete("view");
  } else {
    searchParams.set("view", "deleted");
  }
  setSearchParams(searchParams);
}}
```

No other files need changes -- the sidebar already links to `/clients` which will naturally clear the param.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Clients.tsx` | Replace local `showDeleted` state with URL search param `?view=deleted` |

