"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

export function AIInsights() {
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setCompletion("");
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      console.log("🚀 [AIInsights] Fetching /api/ai/insights...");

      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 [AIInsights] Response received:", {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
      });

      if (!response.ok) throw new Error("Request failed");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("✅ [AIInsights] Stream ended. Total chunks:", chunkCount);
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        console.log(`📦 [AIInsights] Chunk ${chunkCount}:`, JSON.stringify(chunk));

        const lines = chunk.split("\n");
        console.log(`   Lines in chunk: ${lines.length}`);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          console.log(`   Line ${i}:`, JSON.stringify(line));

          if (!line.trim()) {
            console.log(`   → Skipped (empty)`);
            continue;
          }

          // ai@6.x sends chunks in format: 0:"text here"\n
          const textMatch = line.match(/^0:"(.*)"$/);
          if (textMatch) {
            console.log(`   → Matched ai@6.x format. Raw: ${JSON.stringify(textMatch[1])}`);
            try {
              const text = JSON.parse(`"${textMatch[1]}"`);
              console.log(`   → Parsed text: ${JSON.stringify(text)}`);
              setCompletion((prev) => {
                const next = prev + text;
                console.log(`   → Updated completion to ${next.length} chars`);
                return next;
              });
              continue;
            } catch (e) {
              console.log(`   → Parse error:`, e);
            }
          }

          // Try treating line as a JSON string directly (plain text stream format)
          if (line.startsWith('"') && line.endsWith('"')) {
            console.log(`   → Treating as JSON string`);
            try {
              const text = JSON.parse(line);
              console.log(`   → Parsed as JSON: ${JSON.stringify(text)}`);
              if (text) {
                setCompletion((prev) => {
                  const next = prev + text;
                  console.log(`   → Updated completion to ${next.length} chars`);
                  return next;
                });
              }
              continue;
            } catch (e) {
              console.log(`   → JSON parse failed, trying as plain text`);
            }
          }

          // Fallback: try SSE data format
          if (line.startsWith("data: ")) {
            console.log(`   → Matched SSE format`);
            const text = line.slice(6).trim();
            if (text && text !== "[DONE]") {
              try {
                const parsed = JSON.parse(text);
                if (parsed.type === "text-delta" && parsed.textDelta) {
                  console.log(`   → SSE text-delta: ${JSON.stringify(parsed.textDelta)}`);
                  setCompletion((prev) => prev + parsed.textDelta);
                }
              } catch {
                console.log(`   → SSE fallback text: ${JSON.stringify(text)}`);
                setCompletion((prev) => prev + text);
              }
            }
            continue;
          }

          // Fallback: treat as plain text
          console.log(`   → Treating as plain text: ${JSON.stringify(line)}`);
          setCompletion((prev) => {
            const next = prev + line;
            console.log(`   → Updated completion to ${next.length} chars`);
            return next;
          });
        }
      }
    } catch (err) {
      console.error("❌ [AIInsights] Error:", err);
      setError("Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
      <CardContent className="pt-6">
        <Button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-4"
        >
          {isLoading ? "Analyzing..." : "Analyze my progress"}
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !completion && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        )}

        {completion && (
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {completion}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
