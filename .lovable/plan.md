

# Add Preview Button to Documents Table

## Overview

Add a "Preview" button next to the existing "Download" button in the Documents table. This allows client users to view documents in-browser before downloading, improving the user experience.

---

## Implementation Strategy

### Previewable File Types

Based on the `mime_type` field in the documents table, we'll enable preview for:
- **PDF files**: `application/pdf` - most common, excellent browser support
- **Images**: `image/*` (PNG, JPEG, WebP, GIF)

Non-previewable types (Word docs, Excel) will only show the Download button.

---

## Changes Required

### 1. Update PortalDocuments.tsx

**Add Preview Handler**
```typescript
const handlePreview = async (filePath: string, mimeType: string | null) => {
  try {
    const { data, error } = await supabase.storage
      .from("hotel-documents")
      .createSignedUrl(filePath, 300); // 5 min expiry for viewing

    if (error) throw error;

    // Open in new tab for in-browser viewing
    window.open(data.signedUrl, "_blank");
  } catch (error) {
    console.error("Preview error:", error);
    toast.error("Failed to preview document");
  }
};
```

**Add Helper Function**
```typescript
const isPreviewable = (mimeType: string | null): boolean => {
  if (!mimeType) return false;
  return (
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/")
  );
};
```

**Update Table Header**
- Change "Action" column header to "Actions" (plural)
- Increase column width from `w-[100px]` to `w-[160px]`

**Update Action Cell**
```typescript
<TableCell className="text-right">
  <div className="flex items-center justify-end gap-1">
    {isPreviewable(doc.mime_type) && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handlePreview(doc.file_path, doc.mime_type)}
        className="min-h-[44px] sm:min-h-0"
      >
        <Eye className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Preview</span>
      </Button>
    )}
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleDownload(doc.file_path, doc.display_name)}
      className="min-h-[44px] sm:min-h-0"
    >
      <Download className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Download</span>
    </Button>
  </div>
</TableCell>
```

**Add Import**
```typescript
import { FileText, Download, Loader2, FolderOpen, Eye } from "lucide-react";
```

---

### 2. Update DemoPortalDocuments.tsx (for UI parity)

Add the same Preview button to the demo component with simulated behavior:

**Add mime_type to Demo Data**
```typescript
const DEMO_DOCUMENTS = [
  {
    id: "1",
    display_name: "Pilot Agreement - Grand Hyatt",
    category: "Legal",
    mime_type: "application/pdf",
    created_at: subDays(new Date(), 3).toISOString(),
  },
  // ... other documents with mime_type
];
```

**Add Preview Handler**
```typescript
const handlePreview = (displayName: string) => {
  toast.info(`Demo mode: "${displayName}" preview simulated`);
};
```

**Same UI changes as PortalDocuments**

---

## Mobile Responsiveness

The design maintains mobile-first principles:
- On small screens: Only icons are shown (no text labels)
- Buttons use `min-h-[44px]` for touch-friendly tap targets
- Flex container with `gap-1` keeps buttons compact

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/portal/PortalDocuments.tsx` | Add Eye icon import, `handlePreview`, `isPreviewable`, update action cell UI |
| `src/components/portal/DemoPortalDocuments.tsx` | Add Eye icon import, add `mime_type` to demo data, add simulated preview handler, update action cell UI |

---

## Visual Result

**Desktop View:**
```
| Document                        | Category  | Uploaded     | Actions           |
|---------------------------------|-----------|--------------|-------------------|
| 📄 Pilot Agreement - Grand Hyatt | [Legal]   | Feb 5, 2026  | 👁 Preview  ⬇ Download |
```

**Mobile View:**
```
| Document                        | Actions |
|---------------------------------|---------|
| 📄 Pilot Agreement - Grand Hyatt | 👁  ⬇   |
```

