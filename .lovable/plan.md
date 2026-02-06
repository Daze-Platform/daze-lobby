

# Branded PDF Export for Pilot Agreement

## Overview

This plan upgrades the pilot agreement download functionality from a basic `.txt` file to a professionally designed, branded PDF document. The PDF will reflect Daze's "Series C" visual identity with proper typography, logo placement, color accents, and a signature block.

---

## Current State

- The `handleDownload` function creates a plain text blob and downloads it as `.txt`
- No branding, no logo, no visual hierarchy
- Signature is not included in the downloaded document

---

## Implementation Approach

### 1. Install jsPDF Library

Add `jspdf` - a client-side PDF generation library that works well with React and TypeScript.

```text
npm install jspdf
```

This library allows us to programmatically create PDFs with:
- Custom fonts and typography
- Embedded images (logo)
- Precise positioning and layouts
- Color control for brand consistency

---

### 2. Create PDF Generator Utility

Create a new utility file: `src/lib/generateAgreementPdf.ts`

This module will handle all PDF generation logic with:

**Header Section:**
- Daze logo (embedded as base64 or loaded from assets)
- "PILOT AGREEMENT" title in Plus Jakarta Sans styling
- Document metadata (date, document ID)

**Entity Information Block:**
- Partner name and address in a highlighted box
- Authorized signer details

**Agreement Body:**
- Properly formatted sections (numbered clauses)
- Clean typography with appropriate line spacing
- Brand primary color (#3B82F6) for section headers

**Signature Block:**
- Signature image (if signed) embedded in the PDF
- Timestamp and digital signature notice
- "Executed on [date]" formal language

**Footer:**
- Page numbers
- Confidentiality notice
- Daze contact information

---

### 3. PDF Design Specifications

Following Daze's "Series C" aesthetic:

```text
┌─────────────────────────────────────────────────────────────┐
│  [DAZE LOGO]                              Document #: PA-xxx│
│                                           Date: Feb 6, 2026 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     PILOT AGREEMENT                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ PARTNER INFORMATION                                    │ │
│  │ Entity: Pensacola Beach Hospitality Group, LLC        │ │
│  │ Address: 123 Beach Blvd, Pensacola, FL 32507          │ │
│  │ Authorized Signer: John Smith, General Manager        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  1. PURPOSE                                                 │
│  This Pilot Agreement establishes the terms...              │
│                                                             │
│  2. PILOT PERIOD                                            │
│  The pilot period shall commence upon execution...          │
│                                                             │
│  [... remaining clauses ...]                                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  AUTHORIZED SIGNATURE                                       │
│                                                             │
│  [Signature Image]                                          │
│  ________________________________                           │
│  John Smith, General Manager                                │
│  Pensacola Beach Hospitality Group, LLC                     │
│                                                             │
│  Digitally Signed: February 6, 2026 at 3:45 PM             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Page 1 of 1  │  CONFIDENTIAL  │  Daze Technologies, Inc.  │
└─────────────────────────────────────────────────────────────┘
```

**Brand Colors:**
- Primary Blue: `#3B82F6` (section headers, accents)
- Dark Text: `#1E293B` (body text)
- Muted Gray: `#64748B` (secondary text, labels)
- Light Gray: `#F1F5F9` (info box backgrounds)

---

### 4. Update ReviewSignModal Component

Modify the `handleDownload` function to:

1. Import the PDF generator utility
2. Gather all required data (entity info, agreement text, signature if present)
3. Call the generator with proper parameters
4. Download the generated PDF blob

The download button behavior:
- **Draft state**: Download unsigned agreement (no signature block)
- **Signed state**: Download complete agreement with embedded signature image

---

### 5. Logo Handling

Two approaches for the logo:

**Option A: Base64 Embed (Recommended)**
- Convert `daze-logo.png` to base64 string
- Embed directly in the PDF generator
- No async loading required, works offline

**Option B: Dynamic Loading**
- Load logo from `/assets` at generation time
- Requires async handling
- More flexible but adds complexity

We will use Option A for reliability and offline support.

---

## Technical Details

### File Changes

| File | Change |
|------|--------|
| `src/lib/generateAgreementPdf.ts` | New file - PDF generation utility |
| `src/components/portal/ReviewSignModal.tsx` | Update `handleDownload` to use PDF generator |
| `package.json` | Add `jspdf` dependency |

### PDF Generation Flow

```text
User clicks "Download"
        │
        ▼
┌───────────────────┐
│ Gather Data       │
│ - Entity info     │
│ - Agreement text  │
│ - Signature URL   │
│ - Signed date     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Generate PDF      │
│ - Create jsPDF    │
│ - Add header/logo │
│ - Add body text   │
│ - Add signature   │
│ - Add footer      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Download          │
│ pdf.save(name)    │
└───────────────────┘
```

### Key jsPDF Methods Used

```typescript
// Create PDF instance
const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

// Add logo image
pdf.addImage(logoBase64, 'PNG', x, y, width, height);

// Typography
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(24);
pdf.setTextColor(30, 41, 59); // #1E293B

// Add text with wrapping
pdf.text('PILOT AGREEMENT', 105, 40, { align: 'center' });
pdf.splitTextToSize(paragraph, maxWidth);

// Colored rectangles for info boxes
pdf.setFillColor(241, 245, 249); // #F1F5F9
pdf.roundedRect(x, y, width, height, radius, radius, 'F');

// Add signature image
pdf.addImage(signatureDataUrl, 'PNG', x, y, width, height);
```

---

## Summary

This implementation transforms the plain text download into a professionally branded PDF that:

1. Reflects Daze's Series C visual identity
2. Includes the company logo in the header
3. Uses proper typography hierarchy
4. Highlights entity information in a styled box
5. Embeds the digital signature when present
6. Includes proper footer with page numbers and confidentiality notice

The result is a document that clients can share with stakeholders and that represents Daze's brand professionally.

