"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { getStreakHistory } from "@/app/services/habit";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface Streak {
  start_date: string;
  end_date: string;
  length: number;
}

export function StreakTimeline() {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStreakHistory()
      .then((res) => {
        console.log("✅ Streak history loaded:", res.data);
        setStreaks(res.data);
      })
      .catch((err) => {
        console.error("❌ Failed to load streak history:", err);
        setError(`Unable to load streak history: ${err instanceof Error ? err.message : String(err)}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Loading streak history...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-rose-600 dark:text-rose-400">{error}</div>;
  }

  if (streaks.length === 0) {
    return (
      <div className="text-center p-8 text-slate-600 dark:text-slate-400">
        No completed streaks yet. Keep going!
      </div>
    );
  }

  const getStreakColor = (length: number) => {
    if (length >= 100) return "from-purple-500 to-pink-500";
    if (length >= 30) return "from-cyan-500 to-emerald-500";
    if (length >= 7) return "from-amber-500 to-orange-500";
    return "from-slate-400 to-slate-500";
  };

  const getStreakBadge = (length: number) => {
    if (length >= 100) return "🌟";
    if (length >= 30) return "👑";
    if (length >= 7) return "🔥";
    return "💪";
  };

  return (
    <div className="space-y-4">
      {streaks.map((streak, idx) => (
        <div key={`${streak.start_date}-${streak.end_date}`} className="relative">
          {/* Timeline line */}
          {idx !== streaks.length - 1 && (
            <div className="absolute left-6 top-16 bottom-0 w-1 bg-gradient-to-b from-slate-300 dark:from-slate-700 to-transparent" />
          )}

          {/* Timeline dot and card */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center pt-1">
              <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
            </div>

            <Card className={`flex-1 overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-4 shadow-lg`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getStreakBadge(streak.length)}</span>
                    <div>
                      <h3 className="font-semibold text-black dark:text-white">
                        {streak.length}-day streak
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {format(parseISO(streak.start_date), "MMM d")} — {format(parseISO(streak.end_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {Math.ceil((new Date(streak.end_date).getTime() - new Date(streak.start_date).getTime()) / (1000 * 60 * 60 * 24))} consecutive days
                  </div>
                </div>

                {/* Streak length bar */}
                <div className="text-right">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getStreakColor(streak.length)} flex items-center justify-center shadow-lg`}>
                    <span className="text-2xl font-bold text-white">{streak.length}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
