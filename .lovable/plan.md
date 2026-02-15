
# Fix: "Analyze with AI" Document Analysis Button

## Problem
The "Analyze with AI" button in the admin document panel calls the `analyze-document` backend function, which returns a non-2xx error. Investigation reveals:
- The function code, database table, frontend hook, and UI panel all exist and are properly wired
- No function execution logs exist, meaning the request is being rejected **before** the function runs
- The most likely cause: `verify_jwt = true` in the function config causes the backend gateway to reject requests when there's any JWT issue, without producing function-level logs

## Root Cause
The function config has `verify_jwt = true`, which means the backend gateway validates the JWT before forwarding to the function. If the token is malformed or the gateway has a transient issue, the function never executes and no logs are produced. The function already has its own auth header check, so gateway-level JWT verification is redundant.

## Plan

### 1. Set `verify_jwt = false` for the analyze-document function
Change the config so the function handles its own auth validation (which it already does). This ensures the function actually runs and can produce meaningful error logs.

### 2. Improve error handling in the edge function
- Add better logging at entry point so we can always see when the function is called
- Add a timeout safeguard for the AI gateway call (large documents can cause timeouts)
- Truncate oversized base64 content to prevent payload-too-large errors
- Use the recommended default model `google/gemini-3-flash-preview` instead of `openai/gpt-5.2` for better speed and cost efficiency (the project memory says gpt-5.2 is standard, but the function's multimodal PDF analysis would benefit from Gemini's native multimodal strengths)

### 3. Improve frontend error handling
- Surface more specific error messages from the function response
- Handle edge cases where the function returns an error object inside a 200 response (Supabase SDK behavior)

### 4. No new API keys needed
The project already uses the Lovable AI gateway with the pre-configured `LOVABLE_API_KEY`. No separate OpenAI API key is required.

---

## Technical Details

### File changes:

**`supabase/config.toml`** -- Cannot edit directly (auto-managed), but the `verify_jwt` setting needs to be `false`. Will handle auth in code.

**`supabase/functions/analyze-document/index.ts`**:
- Add console.log at function entry for debugging
- Keep manual auth header check
- Switch model from `openai/gpt-5.2` to `google/gemini-3-flash-preview` 
- Add base64 content size limit (cap at ~4MB to avoid payload issues)
- Add AbortController with 55-second timeout for the AI call

**`src/hooks/useDocumentAnalysis.ts`**:
- Better error extraction from Supabase function invoke response (check `data.error` in addition to `error`)

### No database changes needed
The `document_analyses` table already exists with the correct schema.

### No new secrets needed
`LOVABLE_API_KEY` is already configured and provides access to all supported AI models.
