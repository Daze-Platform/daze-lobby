

## Add General Document Upload Slot in Portal Management

### What This Does

Adds a third document upload card in the Control Tower's Documents tab -- an open-ended "Additional Documents" uploader that lets admins upload any file (PDF, DOCX) with a custom display name. These documents will automatically appear in the client's portal Documents library alongside the Pilot Agreement and Security Docs.

### Changes

**File: `src/components/dashboard/portal-management/PortalManagementPanel.tsx`**

- Add a third `AdminDocumentUpload` component below the Security Documentation card, using a new document type `"general"` with:
  - Title: "Additional Document"
  - Description: "Upload any other document to share with this client"
- Filter existing documents to find any with category `"General"` to populate the existing document slot
- Since the current `AdminDocumentUpload` replaces a single file per type, we'll add a **multi-upload variant**: a small list of all `"General"` category documents already uploaded, plus an upload button to add more

**File: `src/components/dashboard/portal-management/AdminDocumentUpload.tsx`**

- Add `"general"` to the `categoryMap` (mapped to `"General"`) and `displayNameMap`
- For the `general` type specifically, add a text input so the admin can provide a custom display name before uploading (defaulting to the file name)
- This way each uploaded general document gets its own meaningful name in the client's document library

**File: `src/components/portal/PortalDocuments.tsx`**

- No changes needed -- it already queries all documents for the client and displays them with their category badge, so any new `"General"` category docs will appear automatically

### Technical Detail

```text
AdminDocumentUpload receives documentType="general"
  --> Shows optional "Document Name" text input above the upload button
  --> On upload: inserts into documents table with:
       display_name = custom name or file name
       category = "General"
       client_id, file_path, etc. as usual
  --> Client portal PortalDocuments already lists all documents
```

The category color for "General" is not yet mapped in `PortalDocuments`, so we'll add a color entry: a neutral blue/gray badge style.

### Summary of File Changes

1. **AdminDocumentUpload.tsx** -- support `"general"` document type with optional custom name input
2. **PortalManagementPanel.tsx** -- add the third upload card for general documents, show list of already-uploaded general docs with delete capability
3. **PortalDocuments.tsx** -- add `"General"` to the category color map (one line)
