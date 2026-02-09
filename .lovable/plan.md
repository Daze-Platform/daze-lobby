

## Replace Pilot Agreement with Revised 10-Page Document

**What changes:** The current simplified agreement (10 short sections, ~1 page) is replaced with the full revised Pilot Agreement from Daze Technologies Corp. (13 sections, 10 pages). The form fields in the portal expand to capture all fill-in blanks from the document, and both the in-modal preview text and the downloadable PDF are updated to match.

---

### New Fields Required

The revised agreement introduces several new fill-in fields beyond the current form. Here is what exists today vs. what is needed:

| Field | Current Form | Revised Agreement |
|-------|-------------|-------------------|
| Client Legal Name | Yes | Yes |
| DBA (Doing Business As) | Yes (as "Property Name") | Yes |
| Address | Yes | Yes |
| Primary Contact | Yes (as "Signer Name") | Yes |
| Title | Yes | Yes |
| Email | No | **New** |
| Covered Outlets (up to 4) | No | **New** |
| Hardware selection (None / Daze-provided) | No | **New** |
| Number of Tablets | No | **New** |
| Mounts/Stands | No | **New** |
| Start Date | No | **New** |
| Pilot Term (days) | No | **New** |
| Pricing Model (radio: None / Subscription / Daze Rev Share / Client Rev Share) | No | **New** |
| Pricing amount/percentage | No | **New** |
| POS System name | No | **New** |
| POS Version | No | **New** |
| POS API Key | No | **New** |
| POS Contact | No | **New** |

---

### Data Storage Strategy

All new fields will be stored in the `onboarding_tasks.data` JSONB column (alongside existing `pilot_signed`, `signature_url`, `signed_at`). No new database columns are needed since the `data` field already holds arbitrary JSON for each task. The existing `clients` table columns (`legal_entity_name`, `billing_address`, `authorized_signer_name`, `authorized_signer_title`) continue to be updated on sign for backward compatibility.

---

### 1. Update ReviewSignModal Form (`src/components/portal/ReviewSignModal.tsx`)

**Entity Information section** expands from 5 fields to a multi-section form:

- **Section A -- Client Identity**: Legal Entity Name, DBA, Address (street/city/state/zip), Primary Contact, Title, Email
- **Section B -- Pilot Scope**: 4 Covered Outlet text inputs, Hardware toggle (None vs Daze-Provided), conditional Tablets count + Mounts/Stands fields
- **Section C -- Pilot Term**: Start Date (date picker), Pilot Term in days (number input, default 90)
- **Section D -- Pricing**: Radio group (No Fees / Subscription / Daze Rev Share / Client Rev Share), conditional amount/percentage input
- **Section E -- POS Integration**: POS System name, Version, API Key, Contact person

The form uses collapsible sections with section headers to keep it manageable. Validation requires Section A fields; Sections B-E fields are optional (blanks show as underlines in the PDF).

**Agreement text preview** (`createAgreementText`) is replaced with the full revised agreement text, with all dynamic values injected and highlighted.

**Interfaces updated**: `LegalEntityData` expands to include all new fields (or a new `PilotAgreementData` interface is created).

### 2. Update PDF Generator (`src/lib/generateAgreementPdf.ts`)

- `GeneratePdfOptions.entity` interface expands to accept all new fields
- `getAgreementSections` is replaced with the full 13-section revised agreement, including:
  - Section 2.1: Covered Outlets listed
  - Section 2.3: Hardware checkbox rendered
  - Section 3: Start Date and Pilot Term filled
  - Section 5: Selected pricing model with amounts
  - Section 13.2: POS details filled
- Signature block updated: dual-column layout (Daze left, Client right) matching the original document format
- Footer updated: "Daze Technologies Corp." on every page with page X/10 numbering
- Company reference updated from "Daze Technologies, Inc." to "Daze Technologies Corp."

### 3. Update LegalStep Component (`src/components/portal/steps/LegalStep.tsx`)

- Pass the expanded data through to `ReviewSignModal`
- The `onSign` callback signature expands to include all new fields in the entity data object
- No structural changes needed; the modal handles everything

### 4. Update Portal Pages (Portal.tsx / PortalAdmin.tsx)

- The `handleSignPilot` function updates to save all new fields into the task's `data` JSONB alongside the existing `pilot_signed`, `signature_url`, `signed_at` values
- The `clients` table update continues writing `legal_entity_name`, `billing_address`, `authorized_signer_name`, `authorized_signer_title` for backward compatibility

---

### Technical Details

**New interface** (`src/lib/generateAgreementPdf.ts`):
```text
PilotAgreementData {
  // Identity (existing)
  legal_entity_name, dba_name, billing_address,
  authorized_signer_name, authorized_signer_title,
  // New fields
  contact_email,
  covered_outlets: string[] (up to 4),
  hardware_option: "none" | "daze_provided",
  num_tablets, mounts_stands,
  start_date, pilot_term_days,
  pricing_model: "none" | "subscription" | "daze_rev_share" | "client_rev_share",
  pricing_amount,
  pos_system, pos_version, pos_api_key, pos_contact,
}
```

**Files modified:**
- `src/components/portal/ReviewSignModal.tsx` -- expanded form, full agreement text
- `src/lib/generateAgreementPdf.ts` -- full 13-section PDF with all dynamic fields
- `src/components/portal/steps/LegalStep.tsx` -- pass expanded data type
- `src/pages/Portal.tsx` -- save expanded fields to task data
- `src/pages/PortalAdmin.tsx` -- same save logic update

**No database migrations needed** -- all new data stored in existing JSONB column.

