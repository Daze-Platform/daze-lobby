

## Improve Pilot Agreement PDF Typography and Design

**Goal:** Transform the downloadable PDF from a flat, single-style text dump into a professionally typeset legal document with clear visual hierarchy using bold, italic, and structured formatting.

---

### Current Problems

- All body text renders at the same weight and style -- no distinction between headings, definitions, labels, and body copy
- Sub-section headers (2.1, 4.1, 5.1, etc.) are not visually differentiated from body text
- Legal definitions and key terms (e.g., "Agreement", "Client Data", "Pilot Term") are not emphasized
- Fill-in field labels (Client Legal Name, DBA, etc.) blend into surrounding text
- The intro paragraph and signature block lack polish
- Bullet points have no indentation

### Design Improvements

**1. Section Title Hierarchy**
- Main section titles (1. PILOT PURPOSE, 2. PILOT SCOPE) -- bold, 12pt, primary blue, uppercase, with a subtle line underneath
- Sub-section titles (2.1 Covered Outlets, 4.1 Daze Responsibilities) -- bold, 10pt, dark text
- Sub-sub labels (5.1 No Fees, 5.2 Subscription) -- bold italic, 9.5pt

**2. Defined Terms in Bold**
- First occurrence of defined terms like "Agreement", "Daze", "Client", "Client Data", "Hardware", "Aggregated Data", "Pilot Term", "MSA" rendered in **bold** when introduced with their definition in parentheses

**3. Field Labels in Bold + Values in Normal**
- Labels like "Client Legal Name:", "Start Date:", "POS System:" rendered bold, with the filled value in normal weight on the same line

**4. Italic Usage**
- Parenthetical clarifications and legal asides rendered in italic (e.g., "(recommended: 60-90 days)", "(Client remains merchant of record)")
- Section references rendered in italic (e.g., "as specified in Section 13.2")

**5. Bullet Point Indentation**
- Bullet items indented 5mm from margin with hanging indent for multi-line items

**6. Intro Block Polish**
- "PILOT AGREEMENT" title stays 22pt bold centered
- "Daze Technologies Corp." subtitle in italic below
- Client info block rendered as a structured label-value table with light background fill

**7. Signature Block Enhancement**
- "IN WITNESS WHEREOF" line rendered in small caps style (uppercase, slightly smaller font)
- Column headers (DAZE TECHNOLOGIES CORP. / CLIENT) bold with primary color
- Field labels (Signature, Name, Title, Date) in italic muted text

---

### Technical Approach

Replace the current flat `splitTextToSize` rendering with a custom rich-text renderer that processes inline markers within the section content. The approach:

1. **Refactor `getAgreementSections`** to return structured content arrays instead of plain strings. Each section becomes an array of "blocks" with types: `paragraph`, `label-value`, `bullet-list`, `subsection-title`, `checkbox-group`

2. **New render functions:**
   - `renderSubsectionTitle(pdf, text, x, y)` -- bold 10pt dark
   - `renderLabelValue(pdf, label, value, x, y)` -- bold label + normal value
   - `renderBulletList(pdf, items, x, y)` -- indented bullets
   - `renderCheckbox(pdf, checked, text, x, y)` -- checkbox character + text
   - `renderItalicNote(pdf, text, x, y)` -- italic muted text

3. **Structured section data format:**
```text
{
  title: "2. PILOT SCOPE",
  blocks: [
    { type: "subsection", text: "2.1 Covered Outlets" },
    { type: "paragraph", text: "The Pilot will be conducted at..." },
    { type: "bullet-list", items: ["Outlet 1", "Outlet 2"] },
    { type: "subsection", text: "2.3 Hardware Selection" },
    { type: "checkbox", checked: true, text: "No Daze Hardware Required" },
    { type: "checkbox", checked: false, text: "Daze-Provided Hardware" },
  ]
}
```

4. The main render loop iterates blocks and delegates to the appropriate renderer, maintaining `y` position tracking and page breaks.

---

### Files Modified

- **`src/lib/generateAgreementPdf.ts`** -- Complete rewrite of section data structure and rendering logic. No other files change since this is purely the PDF output.

