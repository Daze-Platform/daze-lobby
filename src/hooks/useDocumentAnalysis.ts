import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentAnalysis {
  id: string;
  document_id: string;
  client_id: string;
  analysis_type: string;
  completeness_score: number;
  missing_fields: string[];
  extracted_data: Record<string, any>;
  summary: string | null;
  created_at: string;
}

interface AnalyzeParams {
  documentId: string;
  clientId: string;
  documentType: "pilot_agreement" | "security_docs" | "general";
}

export function useDocumentAnalysis(documentId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["document-analysis", documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const { data, error } = await supabase
        .from("document_analyses")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DocumentAnalysis | null;
    },
    enabled: !!documentId,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (params: AnalyzeParams) => {
      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: params,
      });

      if (error) {
        // Check for rate limit / payment errors
        const message = error.message || "";
        if (message.includes("429") || message.includes("rate limit")) {
          throw new Error("AI rate limit exceeded. Please try again in a moment.");
        }
        if (message.includes("402") || message.includes("credits")) {
          throw new Error("AI credits exhausted. Please add credits to continue.");
        }
        throw error;
      }

      return data as {
        completeness_score: number;
        missing_fields: string[];
        extracted_data: Record<string, any>;
        summary: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-analysis", documentId] });
      toast.success("Document analysis complete");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to analyze document");
    },
  });

  return {
    analysis: query.data,
    isLoading: query.isLoading,
    analyze: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
  };
}
