
# Improve Agreement Readability & Add Download Option

## Current State Analysis

The Pilot Agreement modal currently:
- Displays agreement text on the left panel using `ScrollArea`
- Uses a `<pre>` tag with monospace-style formatting
- Has no download functionality

## Requirements

1. **Improved In-Modal Reading**: Ensure the agreement is easily scrollable and readable
2. **Download Option**: Add a button to download the agreement as a file (PDF or text)

---

## Implementation Plan

### 1. Improve Document Reading Experience

**Current issues:**
- The `<pre>` tag may not render as cleanly as styled paragraphs
- No visual indication of scroll progress

**Changes:**
- Replace `<pre>` with properly styled `<div>` sections for better typography
- Add a subtle scroll indicator or ensure the ScrollArea scrollbar is always visible
- Add padding for better readability

### 2. Add Download Button

**Location:** In the document panel header (next to "Agreement Document" label)

**Implementation approach:**
- Add a "Download" button with a download icon
- Generate a text file (`.txt`) or use a simple PDF library
- For simplicity and no additional dependencies, generate a `.txt` file using Blob API

**Technical details:**
```tsx
const handleDownload = () => {
  const blob = new Blob([PILOT_AGREEMENT_TEXT], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Daze_Pilot_Agreement.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

### 3. UI Changes

**File: `src/components/portal/ReviewSignModal.tsx`**

| Section | Change |
|---------|--------|
| Imports | Add `Download` icon from lucide-react |
| Document header | Add download button with icon |
| Document content | Improve typography with better text styling |
| ScrollArea | Ensure it fills available space and scrolls properly |

**New header layout:**
```
+------------------------------------------+
| Agreement Document        [Download ↓]   |
+------------------------------------------+
```

**Download button styling:**
- Small outline/ghost button
- Download icon + optional "Download" text
- Positioned to the right of the header

---

## Technical Implementation

### Changes to ReviewSignModal.tsx

1. **Add import:**
   ```tsx
   import { Check, Loader2, Shield, Calendar, Download } from "lucide-react";
   ```

2. **Add download handler function:**
   ```tsx
   const handleDownload = () => {
     const blob = new Blob([PILOT_AGREEMENT_TEXT], { type: "text/plain" });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = "Daze_Pilot_Agreement.txt";
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
   };
   ```

3. **Update document panel header (lines 129-132):**
   ```tsx
   <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
     <p className="text-sm font-medium text-muted-foreground">Agreement Document</p>
     <Button
       variant="ghost"
       size="sm"
       onClick={handleDownload}
       className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
     >
       <Download className="w-3.5 h-3.5" />
       Download
     </Button>
   </div>
   ```

4. **Improve document typography (lines 133-139):**
   - Keep `ScrollArea` but improve the inner content styling
   - Use proper paragraph spacing and line height
   - Ensure text is easy to read

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/portal/ReviewSignModal.tsx` | Add Download icon import, download handler, update document header with download button |

---

## Result

After implementation:
- Users can scroll through the full agreement in the modal (already works, but improved)
- Users can click "Download" to save the agreement as a `.txt` file to read offline
- The download uses native browser Blob API (no additional dependencies)
- Clean, accessible UI with proper button placement
