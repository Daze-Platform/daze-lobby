

# Fix: "View Portal" Button Navigation on Clients Page

## Problem

The "View portal" button on client cards uses `window.open(..., "_blank")` to open the admin portal in a new tab. On the deployed site, this fails — instead of opening the portal, the page appears to reload the dashboard. This is likely due to the browser's popup blocker silently preventing the new tab from opening, causing only the card's own click handler to fire (which opens the detail panel).

## Solution

Replace `window.open` with React Router's `useNavigate` for reliable in-app navigation. This avoids popup blocker issues entirely and preserves the authenticated session seamlessly.

## Changes

### `src/pages/Clients.tsx`

1. Add `useNavigate` to the existing `react-router-dom` import
2. Replace `window.open(`/admin/portal/${client.client_slug}`, "_blank")` with `navigate(`/admin/portal/${client.client_slug}`)`

This is a minimal two-line change:
- One import update
- One line in the button's `onClick` handler

## Result

Clicking "View portal" will navigate to `/admin/portal/:clientSlug` within the same tab, reliably loading the admin portal view for that client. The back button will return the user to the Clients list.

