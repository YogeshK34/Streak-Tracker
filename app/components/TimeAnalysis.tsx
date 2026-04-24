"use client";

import { useEffect, useState } from "react";
import { getCompletionTimeAnalysis } from "@/app/services/habit";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface TimeData {
  hour: number;
  count: number;
}

export function TimeAnalysis() {
  const [timeData, setTimeData] = useState<TimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCompletionTimeAnalysis()
      .then((res) => {
        console.log("✅ Time analysis loaded:", res.data);
        setTimeData(res.data);
      })
      .catch((err) => {
        console.error("❌ Failed to load time analysis:", err);
        setError(`Unable to load time analysis: ${err instanceof Error ? err.message : String(err)}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Loading time analysis...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-rose-600 dark:text-rose-400">{error}</div>;
  }

  const totalCompletions = timeData.reduce((sum, d) => sum + d.count, 0);

  if (totalCompletions === 0) {
    return (
      <div className="text-center p-8 text-slate-600 dark:text-slate-400">
        No completion time data available yet.
      </div>
    );
  }

  // Find best times
  const sortedByCount = [...timeData].sort((a, b) => b.count - a.count);
  const bestHour = sortedByCount[0];
  const bestTwoBest = sortedByCount.slice(0, 3);

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  // Chart data
  const chartData = timeData.map((d) => ({
    hour: formatHour(d.hour),
    count: d.count,
    percentage: Math.round((d.count / totalCompletions) * 100),
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <TooltipProvider>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="border-slate-200 dark:border-white/10 bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-cyan-500/10 dark:to-emerald-500/10 p-3 sm:p-4 cursor-help">
                <p className="text-xs sm:text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Peak Hour</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400">{formatHour(bestHour.hour)}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{bestHour.count} completions ({Math.round((bestHour.count / totalCompletions) * 100)}%)</p>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              Your most productive hour. Schedule tasks during this time!
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="border-slate-200 dark:border-white/10 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 p-3 sm:p-4 cursor-help">
                <p className="text-xs sm:text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Morning (5-11 AM)</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {Math.round(
                    (timeData
                      .filter((d) => d.hour >= 5 && d.hour < 12)
                      .reduce((sum, d) => sum + d.count, 0) /
                      totalCompletions) *
                      100
                  )}%
                </p>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              Percentage of completions during morning hours
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="border-slate-200 dark:border-white/10 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 p-3 sm:p-4 cursor-help">
                <p className="text-xs sm:text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Evening (6-11 PM)</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(
                    (timeData
                      .filter((d) => d.hour >= 18 && d.hour < 23)
                      .reduce((sum, d) => sum + d.count, 0) /
                      totalCompletions) *
                      100
                  )}%
                </p>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              Percentage of completions during evening hours
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-3 sm:p-6">
        <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-black dark:text-white">Completion Time Distribution</h3>
        <ResponsiveContainer width="100%" height={250} minHeight={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 12 }} angle={-45} height={80} />
            <YAxis tick={{ fill: "#94a3b8" }} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "0.5rem",
                color: "#e2e8f0",
              }}
              formatter={(value: any) => {
                const count = typeof value === 'number' ? value : 0;
                const chartItem = chartData.find((d) => d.count === count);
                return [
                  `${count} completions`,
                  chartItem ? `${chartItem.percentage}%` : "0%",
                ];
              }}
            />
            <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="border-slate-200 dark:border-white/10 bg-blue-50 dark:bg-blue-500/10 p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>Your best time is {formatHour(bestHour.hour)}:</strong> This is when you're most consistent. Schedule your habit tracking around this time for success!
        </p>
      </Card>
    </div>
  );
}
