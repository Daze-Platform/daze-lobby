

# Automated Document Analysis with GPT 5.2

## Overview
Add an AI-powered document analysis feature that automatically reviews uploaded onboarding documents (Pilot Agreements, Security Documentation) for completeness and extracts key information. When an admin uploads a document, they can trigger an "Analyze" action that sends the document to GPT 5.2, which returns a structured completeness report and extracted data fields.

## How It Works (User Perspective)

1. Admin uploads a document (e.g., Pilot Agreement) as they do today
2. An "Analyze with AI" button appears next to each uploaded document
3. Clicking it sends the document for analysis -- a loading state shows progress
4. Results appear in an expandable panel showing:
   - **Completeness Score** (e.g., 85%) with a visual progress ring
   - **Missing Fields** flagged as warnings (e.g., "Billing address not found")
   - **Extracted Data** showing key-value pairs parsed from the document (property name, legal entity, signer name, dates, pricing terms, etc.)
5. Admins can review extracted data and optionally apply it to auto-populate client onboarding fields

## Technical Details

### 1. New Edge Function: `analyze-document`

**File: `supabase/functions/analyze-document/index.ts`**

- Accepts `{ documentId, clientId, documentType }` in the request body
- Downloads the document from the `hotel-documents` storage bucket using the service role key
- Converts the file content to base64 for PDF/image analysis (GPT 5.2 supports multimodal input)
- Sends it to `https://ai.gateway.lovable.dev/v1/chat/completions` with `model: "openai/gpt-5.2"`
- Uses **tool calling** to extract structured output (not raw JSON) with two tools:
  - `analyze_pilot_agreement`: extracts fields matching `PilotAgreementData` type (property name, legal entity, signer, billing address, covered outlets, pricing, POS info, dates)
  - `analyze_security_document`: extracts compliance areas, certifications, expiry dates, coverage gaps
- Returns structured JSON with `{ completeness_score, missing_fields, extracted_data, summary }`
- Handles 429/402 rate limit errors gracefully

### 2. New Database Table: `document_analyses`

Stores analysis results so they persist and don't need re-running:

```text
document_analyses
- id (uuid, PK)
- document_id (uuid, FK -> documents.id)
- client_id (uuid, FK -> clients.id)
- analysis_type (text: "pilot_agreement" | "security_docs")
- completeness_score (integer, 0-100)
- missing_fields (jsonb, array of field descriptions)
- extracted_data (jsonb, key-value pairs)
- summary (text, brief AI summary)
- created_at (timestamptz)
```

RLS policies: only users with dashboard access (`has_dashboard_access`) can read/write.

### 3. Update `supabase/config.toml`

Add the new function entry:

```text
[functions.analyze-document]
verify_jwt = true
```

### 4. New Component: `DocumentAnalysisPanel`

**File: `src/components/dashboard/portal-management/DocumentAnalysisPanel.tsx`**

- Sits below each `AdminDocumentUpload` card when a document exists
- Shows an "Analyze with AI" button (with a sparkle/brain icon)
- On click, calls the edge function via `supabase.functions.invoke('analyze-document', ...)`
- Displays results in an expandable card:
  - Completeness score as a colored badge (green >= 80, amber >= 50, red < 50)
  - List of missing fields with warning icons
  - Extracted data in a clean key-value grid
  - Brief AI summary paragraph
- If analysis already exists (from DB), shows cached results with a "Re-analyze" option
- Loading state with skeleton animation during analysis

### 5. Update `AdminDocumentUpload.tsx`

- Import and render `DocumentAnalysisPanel` below the existing document display when `existingDocument` is present
- Pass `documentId`, `clientId`, and `documentType` as props

### 6. New Hook: `useDocumentAnalysis`

**File: `src/hooks/useDocumentAnalysis.ts`**

- `useQuery` to fetch existing analysis from `document_analyses` table
- `useMutation` to trigger new analysis via the edge function
- Handles loading, error, and success states
- Invalidates cache on new analysis

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/analyze-document/index.ts` | Create -- new edge function |
| `src/components/dashboard/portal-management/DocumentAnalysisPanel.tsx` | Create -- analysis results UI |
| `src/hooks/useDocumentAnalysis.ts` | Create -- data fetching hook |
| `src/components/dashboard/portal-management/AdminDocumentUpload.tsx` | Update -- integrate analysis panel |
| `supabase/config.toml` | Update -- add function config |
| Database migration | Create `document_analyses` table with RLS |

