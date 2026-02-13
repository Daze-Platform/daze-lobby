

## Align Pilot Agreement with Official PDF and Upload to Springhill Suites

This plan covers uploading the official PDF to the admin portal, updating the digital agreement to match the PDF's numbering and content exactly, and locking certain pricing options for the client.

### 1. Upload PDF to Springhill Suites Portal Management

Copy the uploaded PDF into the project's public directory, then programmatically upload it to the `hotel-documents` storage bucket under the Springhill Suites client (ID: `53bd0e70-b268-488e-a947-6d520f516f50`) and insert a `documents` record with category "Contract" and display name "Pilot Agreement". This makes it available in both the admin Portal Management panel and the client-facing Documents library.

### 2. Update Section 5 Numbering to Match PDF

The uploaded PDF uses this numbering:
- **5.1** No Fees
- **5.2** Subscription Platform Fee
- **5.3** Daze Revenue Share Fee
- **5.4** Client Revenue Share Fee
- **5.5** Payment Terms

The current digital version uses 5.1/5.2/5.3 (skipping "No Fees"). Both the live agreement preview and the downloadable PDF need updating.

**Files to update:**
- `src/components/portal/ReviewSignModal.tsx` -- the `createAgreementText()` function (Section 5 block)
- `src/lib/pdf/sections.ts` -- the `getAgreementSections()` function (Section 5 block)

Changes:
- Add "5.1 No Fees" as an always-unchecked option in the agreement text
- Renumber Subscription to 5.2, Daze Revenue Share to 5.3, Client Revenue Share to 5.4
- Keep 5.5 Payment Terms as-is

### 3. Lock 5.1 (No Fees) and 5.2 (Subscription) as Unavailable on Client Form

The client-facing form in `ReviewSignModal.tsx` already hardcodes pricing to `daze_rev_share` at 10%. The Section D pricing display already shows "Daze Revenue Share / 10%". No form changes needed -- just the agreement text numbering update above ensures the document reflects 5.1 and 5.2 as unchecked while 5.3 is checked.

### 4. Add Missing Section 9 Survival Clause

The PDF includes a survival clause paragraph in Section 9 that is missing from the current digital version:

> "Sections 4.3 (Hardware & Physical Materials), 6 (Settlement, Tips, and Chargebacks), 8 (Data, Security, and Confidentiality), 10 (Indemnification), 11 (Limitation of Liability), and 13 (Miscellaneous) shall survive termination."

Add this paragraph to both:
- `ReviewSignModal.tsx` `createAgreementText()`
- `src/lib/pdf/sections.ts` `getAgreementSections()`

### 5. Confirm Existing Implementations (No Changes Needed)

These requirements are already satisfied:
- **Section 2.3**: Binary choice only (No Daze Hardware / Daze-Provided Hardware) -- no tablet/mount quantity fields
- **Revenue share locked at 10%**: Hardcoded in `ReviewSignModal.tsx` lines 447-448
- **Document preview/download**: Already has PDF generation via `generateAgreementPdf()`, signed URL preview, and download button

### Summary of Files Modified

| File | Change |
|------|--------|
| `src/components/portal/ReviewSignModal.tsx` | Update Section 5 numbering in `createAgreementText()`, add Section 9 survival clause |
| `src/lib/pdf/sections.ts` | Update Section 5 numbering in `getAgreementSections()`, add Section 9 survival clause |

Plus a one-time storage upload of the PDF for the Springhill Suites client.

