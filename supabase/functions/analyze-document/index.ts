import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const pilotAgreementTool = {
  type: "function" as const,
  function: {
    name: "analyze_pilot_agreement",
    description:
      "Extract structured fields from a pilot agreement document and assess completeness.",
    parameters: {
      type: "object",
      properties: {
        completeness_score: {
          type: "number",
          description: "Overall completeness percentage from 0 to 100",
        },
        missing_fields: {
          type: "array",
          items: { type: "string" },
          description: "List of important fields that are missing or incomplete",
        },
        summary: {
          type: "string",
          description: "Brief 2-3 sentence summary of the document",
        },
        extracted_data: {
          type: "object",
          properties: {
            property_name: { type: "string" },
            legal_entity_name: { type: "string" },
            dba_name: { type: "string" },
            billing_address: { type: "string" },
            authorized_signer_name: { type: "string" },
            authorized_signer_title: { type: "string" },
            contact_email: { type: "string" },
            covered_outlets: {
              type: "array",
              items: { type: "string" },
            },
            start_date: { type: "string" },
            pilot_term_days: { type: "number" },
            pricing_model: { type: "string" },
            pricing_amount: { type: "string" },
            pos_system: { type: "string" },
            pos_version: { type: "string" },
          },
          additionalProperties: true,
        },
      },
      required: ["completeness_score", "missing_fields", "summary", "extracted_data"],
      additionalProperties: false,
    },
  },
};

const securityDocTool = {
  type: "function" as const,
  function: {
    name: "analyze_security_document",
    description:
      "Extract structured fields from a security/compliance document and assess completeness.",
    parameters: {
      type: "object",
      properties: {
        completeness_score: {
          type: "number",
          description: "Overall completeness percentage from 0 to 100",
        },
        missing_fields: {
          type: "array",
          items: { type: "string" },
          description: "List of important areas that are missing or incomplete",
        },
        summary: {
          type: "string",
          description: "Brief 2-3 sentence summary of the document",
        },
        extracted_data: {
          type: "object",
          properties: {
            compliance_areas: {
              type: "array",
              items: { type: "string" },
            },
            certifications: {
              type: "array",
              items: { type: "string" },
            },
            expiry_dates: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            coverage_gaps: {
              type: "array",
              items: { type: "string" },
            },
            data_handling_policies: { type: "string" },
            encryption_standards: { type: "string" },
          },
          additionalProperties: true,
        },
      },
      required: ["completeness_score", "missing_fields", "summary", "extracted_data"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentId, clientId, documentType } = await req.json();

    if (!documentId || !clientId || !documentType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: documentId, clientId, documentType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("file_path, display_name, mime_type")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("hotel-documents")
      .download(doc.file_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download document" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Content = btoa(binary);

    const mimeType = doc.mime_type || "application/pdf";
    const isPdf = mimeType === "application/pdf";
    const isImage = mimeType.startsWith("image/");

    // Select the right tool based on document type
    const tool = documentType === "pilot_agreement" ? pilotAgreementTool : securityDocTool;
    const toolName =
      documentType === "pilot_agreement"
        ? "analyze_pilot_agreement"
        : "analyze_security_document";

    const systemPrompt = `You are a document analysis expert specializing in onboarding documents for hospitality technology deployments. Analyze the provided document thoroughly and extract all available structured information. Be precise about what's present vs missing. Score completeness based on how many critical fields are filled in.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze this ${documentType === "pilot_agreement" ? "Pilot Agreement" : "Security Documentation"} document. Extract all available fields and assess completeness.`,
      },
    ];

    if (isPdf || isImage) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Content}`,
        },
      });
    } else {
      // For .doc/.docx, send as text context
      userContent[0] = {
        type: "text",
        text: `Analyze this ${documentType === "pilot_agreement" ? "Pilot Agreement" : "Security Documentation"} document. The document content is provided as base64-encoded data (${mimeType}). Extract all available fields and assess completeness. Base64 content: ${base64Content.substring(0, 50000)}`,
      };
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "AI did not return structured analysis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Delete any existing analysis for this document
    await supabase
      .from("document_analyses")
      .delete()
      .eq("document_id", documentId);

    // Store analysis result
    const { error: insertError } = await supabase.from("document_analyses").insert({
      document_id: documentId,
      client_id: clientId,
      analysis_type: documentType,
      completeness_score: Math.round(analysis.completeness_score),
      missing_fields: analysis.missing_fields,
      extracted_data: analysis.extracted_data,
      summary: analysis.summary,
    });

    if (insertError) {
      console.error("Failed to store analysis:", insertError);
    }

    return new Response(
      JSON.stringify({
        completeness_score: Math.round(analysis.completeness_score),
        missing_fields: analysis.missing_fields,
        extracted_data: analysis.extracted_data,
        summary: analysis.summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
