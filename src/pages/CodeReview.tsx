import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { filesToReview } from "@/lib/codeReviewFiles";
import { MagnifyingGlass, Play, ArrowClockwise } from "@phosphor-icons/react";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/code-review`;

export default function CodeReview() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runReview = async () => {
    setResult("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ files: filesToReview }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ error: "Unknown error" }));
        toast({
          title: "Review failed",
          description: errBody.error || `Status ${resp.status}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!resp.body) {
        toast({ title: "No response body", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              accumulated += content;
              setResult(accumulated);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              accumulated += content;
              setResult(accumulated);
            }
          } catch { /* ignore partial */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error("Review stream error:", e);
        toast({
          title: "Review error",
          description: (e as Error).message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MagnifyingGlass size={28} weight="duotone" className="text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Code Review</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis of {filesToReview.length} key source files using GPT 5.2
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isLoading ? (
              <Button variant="destructive" onClick={cancel} size="sm">
                Cancel
              </Button>
            ) : (
              <Button onClick={runReview} size="sm" className="gap-2">
                {result ? (
                  <>
                    <ArrowClockwise size={16} weight="bold" /> Re-run Review
                  </>
                ) : (
                  <>
                    <Play size={16} weight="fill" /> Run Review
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Results</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && !result && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/6" />
              </div>
            )}
            {result ? (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words">
                {result}
              </div>
            ) : (
              !isLoading && (
                <p className="text-muted-foreground text-sm text-center py-12">
                  Click "Run Review" to start the AI-powered code analysis.
                </p>
              )
            )}
            {isLoading && result && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
