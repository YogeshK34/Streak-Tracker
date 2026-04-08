"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, addWeeks, isThisWeek } from "date-fns";
import { getWeeklyStats } from "@/app/services/habit";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface WeekStat {
  week_start: string;
  days_completed: number;
  days_possible: number;
}

export function WeeklyStats() {
  const [stats, setStats] = useState<WeekStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    getWeeklyStats(now.getFullYear(), format(now, "yyyy-MM-dd"))
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error("Failed to load weekly stats:", err);
        setError("Unable to load weekly stats");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Loading weekly stats...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-rose-600 dark:text-rose-400">{error}</div>;
  }

  if (stats.length === 0) {
    return (
      <div className="text-center p-8 text-slate-600 dark:text-slate-400">
        No weekly data available yet.
      </div>
    );
  }

  // Calculate average completion rate
  const avgCompletion = stats.length > 0
    ? Math.round((stats.reduce((acc, w) => acc + (w.days_completed / w.days_possible), 0) / stats.length) * 100)
    : 0;

  // Format data for chart
  const chartData = stats.slice(-12).map((stat) => ({
    week: format(new Date(stat.week_start), "MMM d"),
    completed: stat.days_completed,
    possible: stat.days_possible,
    percentage: Math.round((stat.days_completed / stat.days_possible) * 100),
    isThisWeek: isThisWeek(new Date(stat.week_start)),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-4 text-center">
          <p className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Average Completion</p>
          <p className="mt-2 text-3xl font-bold text-black dark:text-white">{avgCompletion}%</p>
        </Card>

        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-4 text-center">
          <p className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Best Week</p>
          <p className="mt-2 text-3xl font-bold text-cyan-600 dark:text-cyan-400">
            {Math.max(...stats.map((s) => Math.round((s.days_completed / s.days_possible) * 100)))}%
          </p>
        </Card>

        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-4 text-center">
          <p className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Total Weeks</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.length}</p>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-6">
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Weekly Progress (Last 12 weeks)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="week" tick={{ fill: "#94a3b8" }} />
            <YAxis tick={{ fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "0.5rem",
              }}
              label={{ fill: "#cbd5e1" }}
              cursor={{ fill: "rgba(34, 211, 238, 0.1)" }}
            />
            <Legend />
            <Bar dataKey="completed" fill="#06b6d4" name="Days Completed" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.isThisWeek ? "#22d3ee" : "#06b6d4"} />
              ))}
            </Bar>
            <Bar dataKey="possible" fill="#cbd5e1" name="Days Possible" radius={[8, 8, 0, 0]} opacity={0.3} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
