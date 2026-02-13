

## Allow PNG/JPG Uploads for Document Uploads

### What Changes

Only one file needs updating. The admin document upload component (`AdminDocumentUpload.tsx`) currently restricts uploads to `.pdf,.doc,.docx`. The client portal document viewer already supports image preview.

### File Change

**`src/components/dashboard/portal-management/AdminDocumentUpload.tsx` (line 189)**

Change the `accept` attribute from:
```
accept=".pdf,.doc,.docx"
```
to:
```
accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
```

This applies to all admin document upload slots (Pilot Agreement, Security Docs, and Additional Documents), allowing admins to upload images alongside traditional document formats. The client portal's document library already detects image MIME types and shows the Preview button for them, so no changes are needed on the client side.

### What Already Works
- **Client portal view** (`PortalDocuments.tsx`): Already handles image preview via `isPreviewable()` which checks for `image/*` MIME types
- **Internal client detail uploads** (`DocumentUploadSection.tsx`): Already accepts `.png,.jpg,.jpeg`

