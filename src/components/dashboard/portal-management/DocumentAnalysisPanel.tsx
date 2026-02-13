import { useState } from "react";
import { useDocumentAnalysis } from "@/hooks/useDocumentAnalysis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sparkles, AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DocumentAnalysisPanelProps {
  documentId: string;
  clientId: string;
  documentType: "pilot_agreement" | "security_docs" | "general";
}

export function DocumentAnalysisPanel({
  documentId,
  clientId,
  documentType,
}: DocumentAnalysisPanelProps) {
  const { analysis, isLoading, analyze, isAnalyzing } = useDocumentAnalysis(documentId);
  const [isOpen, setIsOpen] = useState(false);

  const handleAnalyze = () => {
    analyze({ documentId, clientId, documentType });
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (score >= 50) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-red-500/10 text-red-600 border-red-500/20";
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Analyzing document with AI...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleAnalyze}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Analyze with AI
      </Button>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-3 hover:bg-muted/30 transition-colors text-left">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn("text-xs font-semibold", scoreColor(analysis.completeness_score))}
              >
                {analysis.completeness_score}%
              </Badge>
              <span className="text-sm font-medium">AI Analysis</span>
              {analysis.missing_fields.length > 0 && (
                <span className="text-2xs text-muted-foreground">
                  · {analysis.missing_fields.length} missing field{analysis.missing_fields.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
            {/* Summary */}
            {analysis.summary && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
            )}

            {/* Missing Fields */}
            {analysis.missing_fields.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Missing Fields
                </p>
                <div className="space-y-1">
                  {analysis.missing_fields.map((field, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-amber-600"
                    >
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{field}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Data */}
            {analysis.extracted_data &&
              Object.keys(analysis.extracted_data).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Extracted Data
                  </p>
                  <div className="grid gap-1">
                    {Object.entries(analysis.extracted_data).map(([key, value]) => {
                      if (value === null || value === undefined || value === "") return null;
                      const label = key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                      const displayValue = Array.isArray(value)
                        ? value.join(", ")
                        : typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value);
                      return (
                        <div key={key} className="flex justify-between gap-2 text-xs py-0.5">
                          <span className="text-muted-foreground truncate">{label}</span>
                          <span className="font-medium text-right max-w-[60%] truncate">
                            {displayValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-2xs text-muted-foreground">
                Analyzed {format(new Date(analysis.created_at), "MMM d, yyyy")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                <RefreshCw className="h-3 w-3" />
                Re-analyze
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
