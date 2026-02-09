

# Fix Document Preview Popup Blocker Issue

## Problem

When clicking the "Preview" button, the document doesn't open in a new browser tab. This is caused by **browser popup blocking** - modern browsers require `window.open()` to be called synchronously within a user gesture (click event). The current implementation calls `window.open()` **after** an async `await` statement, which breaks the gesture context.

**Current Flow (Blocked):**
```text
Click → await createSignedUrl() → window.open() ❌
        ↑ gesture lost here
```

---

## Solution

Open the new window **immediately** on click (preserving the gesture context), then update its location after the signed URL is fetched.

**Fixed Flow:**
```text
Click → window.open('about:blank') → await createSignedUrl() → newWindow.location = url ✓
        ↑ gesture preserved
```

---

## Changes Required

### 1. Update PortalDocuments.tsx

**Current handlePreview (broken):**
```typescript
const handlePreview = async (filePath: string) => {
  try {
    const { data, error } = await supabase.storage
      .from("hotel-documents")
      .createSignedUrl(filePath, 300);

    if (error) throw error;
    window.open(data.signedUrl, "_blank"); // ❌ Blocked by browser
  } catch (error) {
    toast.error("Failed to preview document");
  }
};
```

**Fixed handlePreview:**
```typescript
const handlePreview = async (filePath: string) => {
  // Open window IMMEDIATELY in user gesture context
  const newWindow = window.open('about:blank', '_blank');
  
  if (!newWindow) {
    toast.error("Please allow popups for this site to preview documents");
    return;
  }

  try {
    const { data, error } = await supabase.storage
      .from("hotel-documents")
      .createSignedUrl(filePath, 300);

    if (error) throw error;
    
    // Navigate the already-opened window to the signed URL
    newWindow.location.href = data.signedUrl;
  } catch (error) {
    console.error("Preview error:", error);
    newWindow.close(); // Close the blank tab on error
    toast.error("Failed to preview document");
  }
};
```

### 2. Update handleDownload with same fix

Apply the same pattern to ensure downloads also work reliably:

```typescript
const handleDownload = async (filePath: string, displayName: string) => {
  const newWindow = window.open('about:blank', '_blank');
  
  if (!newWindow) {
    toast.error("Please allow popups for this site to download documents");
    return;
  }

  try {
    const { data, error } = await supabase.storage
      .from("hotel-documents")
      .createSignedUrl(filePath, 60);

    if (error) throw error;
    newWindow.location.href = data.signedUrl;
  } catch (error) {
    console.error("Download error:", error);
    newWindow.close();
    toast.error("Failed to download document");
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/portal/PortalDocuments.tsx` | Update `handlePreview` and `handleDownload` to open window synchronously |

---

## Technical Explanation

**Why this works:**

Browsers track whether code is running in a "user gesture" context. When you call `window.open()` directly inside a click handler, the browser allows it. But when you `await` something first, the JavaScript engine completes the original call stack and returns control to the browser - losing the gesture context.

By calling `window.open('about:blank', '_blank')` **before** the await, we:
1. Get a valid window reference while still in the gesture context
2. Perform the async operation
3. Update the already-opened window's location

The user sees a brief blank tab that immediately navigates to the document.

