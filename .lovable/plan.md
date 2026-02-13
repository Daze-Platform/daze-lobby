

## Fix Activity Feed Document Upload Labels

### Problem
When admins upload documents, the activity log stores the UI card title (e.g., "Upload Document") as the `title` in details. This shows up in the activity feed as "uploaded Upload Document" instead of a meaningful label.

### Logic
- Documents with specific types (`pilot_agreement`, `security_docs`) have known titles: "Pilot Agreement Document" and "Security Documentation"
- Any document that doesn't match these specific titles should display as "additional documents"

### Changes

**1. `src/components/dashboard/portal-management/AdminDocumentUpload.tsx` (line 103)**

Change the logged title to use the proper display name instead of the raw `title` prop:

```ts
// Before:
logActivity.mutate({ action: "document_uploaded", details: { type: documentType, title } });

// After:
const logTitle = documentType === "pilot_agreement" 
  ? "Pilot Agreement Document" 
  : documentType === "security_docs" 
    ? "Security Documentation" 
    : "additional documents";
logActivity.mutate({ action: "document_uploaded", details: { type: documentType, title: logTitle } });
```

**2. `src/components/portal/ActivityFeedPanel.tsx` (line 96)**

Update the `document_uploaded` format to handle any title that isn't a recognized specific document type as "additional documents":

```ts
// Before:
document_uploaded: `uploaded ${(details?.title as string) || "a document"}`,

// After - apply fallback logic for display:
document_uploaded: (() => {
  const t = details?.title as string;
  if (t === "Pilot Agreement Document" || t === "Security Documentation") return `uploaded ${t}`;
  return "uploaded additional documents";
})(),
```

This ensures:
- Past logs with "Upload Document" as title will also render correctly as "uploaded additional documents"
- New uploads will log the correct title going forward
- "Pilot Agreement Document" and "Security Documentation" continue showing their specific names

