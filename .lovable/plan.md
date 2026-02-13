

# Exclude Deleted Clients from Admin Portal Switcher

## Problem

The `ClientContext` query for admin users (line 93-96 in `src/contexts/ClientContext.tsx`) fetches all clients without filtering out soft-deleted ones. This means deleted clients still appear in the admin portal's client switcher dropdown.

## Fix

### File: `src/contexts/ClientContext.tsx` (line 96)

Add `.is("deleted_at", null)` to the admin all-clients query, right before `.order(...)`:

```
// Before:
.order("name", { ascending: true });

// After:
.is("deleted_at", null)
.order("name", { ascending: true });
```

This ensures only active (non-deleted) clients appear in the admin client switcher, consistent with the main Clients list behavior.

