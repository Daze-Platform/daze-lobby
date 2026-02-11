import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files } = await req.json() as {
      files: { path: string; content: string }[];
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build file listing for the prompt
    const fileContents = files
      .map((f) => `### ${f.path}\n\`\`\`typescript\n${f.content}\n\`\`\``)
      .join("\n\n");

    const systemPrompt = `You are a senior full-stack code reviewer specializing in React, TypeScript, Supabase, and Tailwind CSS applications.

Analyze the provided codebase and produce a structured review covering these categories. Use markdown formatting with clear headers.

## Categories to Review

### 🏗️ Architecture
- Component structure, separation of concerns, file organization
- State management patterns, data flow

### 🔒 Security
- RLS policy coverage, auth patterns, data exposure risks
- Input validation, XSS/injection vectors

### ⚡ Performance
- Unnecessary re-renders, missing memoization
- Query optimization, bundle size concerns

### 🔤 Type Safety
- Usage of \`any\`, missing types, loose type assertions
- Generic usage, discriminated unions where appropriate

### 🛡️ Error Handling
- Try/catch coverage, error boundary usage
- User-facing error messages, graceful degradation

### ✨ Best Practices
- React patterns (hooks rules, key props, effect deps)
- Code duplication, naming conventions, dead code

## Output Format
For each finding, provide:
1. **File**: which file the issue is in
2. **Issue**: clear description
3. **Severity**: 🔴 Critical | 🟡 Warning | 🔵 Info
4. **Suggestion**: actionable fix

End with a brief **Summary** section with an overall health score (A-F) and top 3 priorities.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5.2",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Please review the following codebase:\n\n${fileContents}`,
            },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("code-review error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
