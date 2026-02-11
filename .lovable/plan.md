

## Remove Code Review from Frontend

The Code Review page and its navigation entry will be removed from the frontend. The edge function (`supabase/functions/code-review`) will remain available for internal use, but nothing will be exposed in the UI.

### Changes

1. **Delete `src/pages/CodeReview.tsx`** - Remove the entire page component
2. **Delete `src/lib/codeReviewFiles.ts`** - Remove the raw file imports bundle (no longer needed in the frontend)
3. **Remove route from `src/App.tsx`** - Delete the `/code-review` route and its import
4. **Remove sidebar link** - Remove the "Code Review" entry from `src/components/layout/DashboardSidebar.tsx` if it exists there

### What stays
- The `supabase/functions/code-review/index.ts` edge function remains deployed and callable for internal/manual use

