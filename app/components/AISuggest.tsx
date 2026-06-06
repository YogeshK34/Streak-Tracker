"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface Suggestion {
  problem_name: string;
  reason: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export function AISuggest() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await (await import("@/lib/supabase-client")).supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const json = await res.json();
      setSuggestions(json.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return { variant: "secondary" as const, className: "text-green-700 dark:text-green-300" };
      case "Medium":
        return { variant: "outline" as const, className: "" };
      case "Hard":
        return { variant: "destructive" as const, className: "" };
      default:
        return { variant: "outline" as const, className: "" };
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm py-2 h-auto"
      >
        {isLoading ? "Thinking..." : "What should I practice next?"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {suggestions.length > 0 && !isLoading && (
        <div className="space-y-2 sm:space-y-3">
          {suggestions.map((suggestion, idx) => {
            const badgeStyle = getDifficultyBadgeVariant(suggestion.difficulty);
            return (
              <Card key={idx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      {suggestion.problem_name}
                    </p>
                    <Badge variant={badgeStyle.variant} className={badgeStyle.className}>
                      {suggestion.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {suggestion.reason}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
