
Goal: Make the “Confirm & Sign” and “Clear” buttons reliably appear in the Pilot Agreement modal, and ensure the signing footer never gets clipped off-screen.

What’s happening (based on code + your screenshot)
- The buttons are present in `src/components/portal/ReviewSignModal.tsx` (lines ~201–233).
- In the UI, the signature panel is being height-constrained/clipped, so the footer area (where the buttons live) is not visible.
- This is a common flexbox issue when nested flex/grid children don’t have `min-h-0` (and/or when a child can’t shrink), causing overflow to clip content.

Implementation changes (UI layout fix)
1) Update `src/components/portal/ReviewSignModal.tsx` to make the right “Signature Panel” column shrink correctly:
   - Add `min-h-0` to containers that are `flex-1` and contain nested flex children.
   - Remove dependence on `justify-between` for vertical placement and instead use `mt-auto` on the footer so it pins to the bottom within the available height.
   - Ensure the signing content area can scroll if necessary (especially on smaller laptop heights).

   Concretely:
   - Signature column wrapper: change
     - `className="flex flex-col"`
     - to `className="flex flex-col min-h-0"`
   - Signature panel inner container: change
     - `className="flex-1 p-6 flex flex-col justify-between"`
     - to `className="flex-1 p-6 flex flex-col min-h-0"`
   - Signing-state top section: ensure it can shrink by adding `min-h-0` and (optionally) `overflow-auto`:
     - e.g. `className="flex-1 flex flex-col min-h-0 overflow-auto"`
   - Footer (buttons section): add `mt-auto` so it always sits at the bottom of the column:
     - e.g. `className="mt-4 pt-4 space-y-3 border-t"`

   Result:
   - Buttons remain in the DOM and visible.
   - On short viewports, the signature area scrolls, not the footer disappearing.

2) Make the footer unmistakably present
   - Keep the `flex gap-3` row with:
     - left: “Clear” (outline/gray)
     - right: “Confirm & Sign” (primary)
   - Keep validation:
     - both buttons disabled until `hasSignature === true`
     - show loading state on confirm when `isSubmitting`

Verification checklist (quick)
- Open Portal Preview and/or Portal
- Open Legal → Pilot Agreement
- Confirm both buttons are visible immediately (disabled)
- Draw on canvas → buttons enable
- Confirm the buttons remain visible even if you resize the window height smaller
- Check mobile layout (single-column): footer still visible below pad

If you want me to continue in a new request after this (since you asked to stop tools/time-critical), I can implement the exact CSS/class fixes above and re-verify the modal in both `/portal-preview` and the authenticated `/portal` route.
