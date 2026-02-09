

## Route Generated Documents to the Documents Tab

**What this solves:** Currently, the Pilot Agreement PDF is generated entirely in the browser and downloaded via `pdf.save()` -- it never gets stored in your backend. This means it doesn't appear in the Documents tab. Admin-uploaded documents (Pilot Agreement uploads, Security Docs) are already stored correctly and should appear in the Documents tab -- if they're not showing, it's a data/query issue we'll verify.

---

### Changes

**1. Save Pilot Agreement PDF to Storage on Signing**

When a client signs the agreement, generate the PDF and upload it to storage, then insert a record into the `documents` table so it appears in the Documents tab automatically.

- **File: `src/lib/generateAgreementPdf.ts`**
  - Refactor `generateAgreementPdf` to return the PDF blob instead of calling `pdf.save()` directly
  - Add a new export: `generateAgreementPdfBlob()` that returns `Blob` 
  - Keep the existing `generateAgreementPdf()` function working for the manual download button by calling the blob function + triggering browser download

- **File: `src/hooks/useClientPortal.ts`**
  - In `signLegalMutation`, after signing is complete, generate the PDF blob using `generateAgreementPdfBlob()`
  - Upload the PDF to the `hotel-documents` storage bucket at path `{clientId}/pilot-agreement-signed.pdf`
  - Insert a record into the `documents` table with:
    - `display_name`: "Pilot Agreement (Signed)"
    - `category`: "Contract"
    - `mime_type`: "application/pdf"
  - Invalidate the `["documents", clientId]` query key so the Documents tab updates immediately

**2. Verify Admin Document Visibility**

Admin-uploaded documents already use the same `documents` table and query key pattern. No code changes needed -- they should already appear. If there's an issue, it would be RLS-related (we'll verify the existing policies are correct).

---

### Flow After Implementation

```text
Client signs agreement
  --> Signature image uploaded to "contracts" bucket (existing)
  --> PDF generated in browser
  --> PDF uploaded to "hotel-documents" bucket (NEW)
  --> Record inserted into "documents" table (NEW)
  --> Documents tab shows "Pilot Agreement (Signed)" with Preview/Download
```

### Files Modified

- `src/lib/generateAgreementPdf.ts` -- Split into blob generation + download trigger
- `src/hooks/useClientPortal.ts` -- Add PDF upload + document record creation in sign mutation

