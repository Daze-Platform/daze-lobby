

## Performance: Speed Up Signature Registration and Data Loading

### Problem Analysis

**Issue 1: Signature takes a long time to register**

The `signLegalMutation` in `useClientPortal.ts` performs 7 sequential operations before showing success:
1. Update client record with legal entity data
2. Convert signature to blob and upload to storage
3. Generate a signed URL for the signature
4. Update the legal task with all agreement fields
5. Generate a multi-page PDF from the agreement data
6. Upload the PDF to storage
7. Insert a document record

Steps 5-7 (PDF generation and upload) are non-critical -- the agreement is already saved after step 4. These can run in the background.

**Issue 2: Form data takes a while to load on reopen**

After signing, `queryClient.invalidateQueries` triggers network refetches. The modal data depends on these queries completing before the `hotelLegalEntity` memo updates. This is inherent latency from the cache invalidation round-trip.

### Fix 1: Move PDF generation to background (non-blocking)

**File: `src/hooks/useClientPortal.ts`**

Split the mutation so that steps 1-4 complete and trigger `onSuccess` immediately. Steps 5-7 (PDF generation/upload/document insert) run as a fire-and-forget `Promise` after the mutation resolves -- they don't block the UI or the success toast.

```text
Before (sequential):
  client update -> signature upload -> signed URL -> task update -> PDF gen -> PDF upload -> doc insert -> onSuccess

After (parallel tail):
  client update -> signature upload -> signed URL -> task update -> onSuccess
                                                                      |
                                                          (background) PDF gen -> PDF upload -> doc insert
```

### Fix 2: Optimistic cache update after signing

**File: `src/hooks/useClientPortal.ts`**

Add `onMutate` to the `signLegalMutation` that optimistically updates the `onboarding-tasks` query cache with `pilot_signed: true`, `signed_at`, and `is_completed: true`. This makes the UI reflect the signed state instantly without waiting for the refetch round-trip.

### Fix 3: Pre-seed query cache for faster data reload

**File: `src/hooks/useClientPortal.ts`**

In the `onSuccess` of `signLegalMutation`, use `queryClient.setQueryData` to directly inject the known task data into the cache instead of only calling `invalidateQueries`. This eliminates the network round-trip for the immediate UI update (a background refetch still happens to sync).

### Technical Details

- PDF generation will use a detached async block (`Promise.resolve().then(...)`) so errors in PDF generation never affect the signing success path.
- Console warnings will still log if PDF upload fails.
- The optimistic update in `onMutate` follows the existing enterprise pattern of snapshot + rollback on error.
- The `client` query will also get a direct `setQueryData` update for the 4 core legal entity fields, so the `hotelLegalEntity` memo recomputes immediately.
- No database or schema changes needed.

### Files Changed
- `src/hooks/useClientPortal.ts` -- restructure `signLegalMutation` for background PDF, add optimistic updates

