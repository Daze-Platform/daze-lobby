

# Refine Portal Access URL Preview to Match Portal Management Pattern

## Problem with Current Approach

The current fix shows the full URL including `?email=msutherland@vistahost.com` in monospace with `break-all` wrapping. This is:

- Visually noisy -- long wrapped monospace text in a compact modal
- Redundant -- the email appears both in the URL and the "For:" label
- Inconsistent -- the Portal Management panel only shows `/portal/{slug}` as the preview

## Better Approach

Mirror the Portal Management panel pattern exactly:

- Show only the **short path** (`/portal/{slug}`) in the preview -- clean and readable
- Keep the **"For:" label** to communicate personalization
- Build the full URL with `?email=` only at **copy time** (already works this way via `handleCopyUrl`)
- Keep the stacked vertical layout with full-width button (this part of the fix was correct)

## Changes

### File: `src/components/modals/NewClientModal.tsx` (lines 671-693)

Replace the current URL preview block:

```
Before:
  <p className="text-xs font-mono text-foreground break-all">
    {portalBaseUrl}{customSlug}
    {contacts[0]?.email?.trim() && (
      <span className="text-muted-foreground">?email={contacts[0].email.trim()}</span>
    )}
  </p>

After:
  <p className="text-xs font-mono text-muted-foreground truncate">
    /portal/{customSlug}
  </p>
```

Everything else stays the same -- the "For:" label, the full-width "Copy Invite Link" button, and the copy logic that already appends the email parameter behind the scenes.

## Result

The URL preview will show a clean, single-line `/portal/springhill-suites-orange-beach` that never overflows, while the "For:" label communicates who the link is personalized for. The full URL with email is only constructed when the admin clicks "Copy Invite Link."

## Files Changed

| File | Change |
|------|--------|
| `src/components/modals/NewClientModal.tsx` | Simplify URL preview to show short path only, matching Portal Management panel |

