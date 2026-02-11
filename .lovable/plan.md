
## AI-Powered Codebase Review with GPT 5.2

### What This Does
Adds a "Code Review" feature to the dashboard that sends your key source files to OpenAI's GPT 5.2 model (via Lovable AI) and returns a structured analysis covering code quality, security, performance, and architecture.

### How It Works
1. A new "Code Review" page accessible from the dashboard sidebar
2. Click "Run Review" to send the codebase to GPT 5.2
3. The AI analyzes key areas: architecture, security (RLS, auth), performance, type safety, and patterns
4. Results stream back in real-time and are displayed in categorized sections

### User Flow
```text
Dashboard Sidebar -> "Code Review" link -> Click "Run Review" -> Streaming results appear in cards
```

### What Gets Reviewed
The edge function will bundle and send the most impactful files for review:
- **Hooks** (useClients, useDevices, useMessages, useAuth, etc.) -- core business logic
- **Pages** (Dashboard, Clients, Devices, Blockers, Portal, Auth) -- routing and page structure
- **Key components** (KanbanBoard, ActivityFeedPanel, modals) -- complex UI logic
- **Contexts** (AuthContext, ClientContext, VenueContext) -- state management
- **Types** (client, auth, task, venue) -- type definitions
- **Utilities** (auth, utils, fileValidation) -- shared helpers

Files like UI primitives (button, card, etc.) are excluded since they are standard shadcn components.

---

### Technical Details

**1. Edge Function: `supabase/functions/code-review/index.ts`**
- Accepts a POST with `{ files: { path: string, content: string }[] }`
- Constructs a system prompt instructing GPT 5.2 to act as a senior code reviewer
- Sends to `https://ai.gateway.lovable.dev/v1/chat/completions` with model `openai/gpt-5.2`
- Streams the response back as SSE for real-time display
- Review categories: Architecture, Security, Performance, Type Safety, Error Handling, Best Practices
- Handles 429/402 rate limit errors gracefully

**2. Update `supabase/config.toml`**
- Add `[functions.code-review]` with `verify_jwt = true` (admin-only)

**3. New Page: `src/pages/CodeReview.tsx`**
- "Run Review" button that collects key source files and sends them to the edge function
- Streams tokens and renders the review in a readable format with markdown support
- Shows loading state during analysis
- Displays results in a clean card layout

**4. File Collection: `src/lib/codeReviewFiles.ts`**
- A static list of file paths to include in the review
- A function that reads their content by fetching from the project (or hardcoded content bundled at build time)
- Since we cannot read files from the browser at runtime, the files will be imported as raw strings using Vite's `?raw` import suffix

**5. Sidebar Update: `src/components/layout/DashboardSidebar.tsx`**
- Add a "Code Review" nav item under a new "TOOLS" section with a code icon

**6. Route: `src/App.tsx`**
- Add `/code-review` route pointing to the new page, protected behind admin role

### Files to Create
- `supabase/functions/code-review/index.ts`
- `src/pages/CodeReview.tsx`
- `src/lib/codeReviewFiles.ts`

### Files to Modify
- `supabase/config.toml` -- add function config
- `src/components/layout/DashboardSidebar.tsx` -- add nav link
- `src/App.tsx` -- add route
