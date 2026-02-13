

## Add Onboarding Summary Slide to Welcome Tour

### Goal
Expand the Welcome Tour with an additional slide that explains what the platform does and summarizes the onboarding steps clients need to complete to go live.

### Current State
The tour has 3 slides:
1. "Welcome to a brighter day." -- intro to Daze
2. "Effortless service, floating on air." -- upload menus/branding, hardware, training
3. "Ready for Takeoff?" -- CTA to start the 3 setup tasks

### Proposed Change
Insert a new slide at position 2 (between the current slides 1 and 2) that acts as a platform overview and onboarding roadmap. The new 4-slide sequence:

1. **"Welcome to a brighter day."** (unchanged)
2. **NEW -- "Your path to going live."** -- Summarizes the 5 onboarding steps: Brand Identity, Venues, POS Integration, Devices, and Legal. Frames it as a simple checklist so clients know exactly what to expect.
3. **"Effortless service, floating on air."** (unchanged -- explains Daze handles hardware/training)
4. **"Ready for Takeoff?"** (unchanged -- CTA)

### Technical Details

**File: `src/components/portal/WelcomeTour.tsx`**

- Add a new entry to the `TOUR_SLIDES` array at index 1 with:
  - `headline`: "Your path to going live."
  - `subtext`: A concise summary like "Complete five simple steps -- share your brand, set up your venues, connect your POS, confirm your devices, and sign off on the agreement. We handle the rest."
  - `icon`: `ClipboardList` from lucide-react (fits the checklist/roadmap concept)
- Update the `ClipboardList` import from `lucide-react`
- No other files need changes -- the tour already dynamically renders dots and navigation based on the array length

