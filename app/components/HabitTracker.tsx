"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isFuture,
  startOfDay,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Sparkles, Flame, CalendarDays, Moon, Sun, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getHabitDays, setHabitDay, exportHabitData } from "@/app/services/habit";
import { getLeetCodeProblems } from "@/app/services/leetcode";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/lib/auth-context";
import { checkDatabaseSetup } from "@/lib/db-debug";
import { StreakTimeline } from "./StreakTimeline";
import { WeeklyStats } from "./WeeklyStats";
import { TimeAnalysis } from "./TimeAnalysis";
import { Achievements } from "./Achievements";
import { LeetCodeTracker } from "./LeetCodeTracker";

interface MarkedDays {
  [key: string]: boolean;
}

type TabType = "calendar" | "history" | "weekly" | "time" | "achievements" | "leetcode";

export function HabitTracker() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [markedDays, setMarkedDays] = useState<MarkedDays>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("calendar");
  const [exporting, setExporting] = useState(false);
  const [leetcodeProblemCount, setLeetcodeProblemCount] = useState(0);
  const [leetcodeProblemsByDate, setLeetcodeProblemsByDate] = useState<Record<string, number>>({});
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const today = startOfDay(new Date());
  const todayKey = format(today, "yyyy-MM-dd");

  useEffect(() => {
    if (!user) {
      setIsLoaded(false);
      return;
    }

    // Debug: Check database schema
    checkDatabaseSetup();

    getHabitDays()
      .then((res) => {
        const mappedDays: MarkedDays = {};
        res.data.forEach((day: { date: string }) => {
          mappedDays[day.date] = true;
        });
        setMarkedDays(mappedDays);
      })
      .catch((loadError) => {
        console.error("Failed to load habit tracker data:", loadError);
        setError("Unable to load habit history. Try refreshing.");
      })
      .finally(() => {
        setIsLoaded(true);
      });

    // Load LeetCode problem count
    getLeetCodeProblems()
      .then((res) => {
        setLeetcodeProblemCount(res.data.length);

        // Create a map of dates to problem counts
        const problemsByDate: Record<string, number> = {};
        res.data.forEach((problem) => {
          const date = problem.problem_date;
          problemsByDate[date] = (problemsByDate[date] || 0) + 1;
        });
        setLeetcodeProblemsByDate(problemsByDate);
      })
      .catch((err) => {
        console.error("Failed to load LeetCode problems count:", err);
        // Don't show error for this, it's optional
      });
  }, [user]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const emptyDaysAtStart = Array(firstDayOfWeek).fill(null);
  const calendarDays = [...emptyDaysAtStart, ...daysInMonth];

  const trackedDays = useMemo(
    () => Object.keys(markedDays).filter((date) => {
      const day = new Date(date);
      return day.getMonth() === currentMonth.getMonth() && day.getFullYear() === currentMonth.getFullYear();
    }).length,
    [markedDays, currentMonth]
  );

  const daysThisMonth = useMemo(
    () => daysInMonth.filter((day) => !isFuture(day)).length,
    [daysInMonth]
  );

  const completionPercent = daysThisMonth
    ? Math.round((trackedDays / daysThisMonth) * 100)
    : 0;

  const currentStreak = useMemo(() => {
    // Current streak must include today - if today is not marked, streak is 0
    const todayStr = format(today, "yyyy-MM-dd");
    if (!markedDays[todayStr]) return 0;

    // Count consecutive marked days backwards from today
    let streak = 0;
    let currentDate = today;

    while (true) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      if (markedDays[dateStr]) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  }, [markedDays, today]);

  const longestStreak = useMemo(() => {
    const sortedDates = Object.entries(markedDays)
      .filter(([, marked]) => marked)
      .map(([date]) => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (sortedDates.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currDate = sortedDates[i];
      const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  }, [markedDays]);

  const handleDayClick = async (day: Date) => {
    // Allow marking only today (not past days or future days)
    if (isFuture(day)) return;

    const daysInPast = Math.floor((today.getTime() - startOfDay(day).getTime()) / (1000 * 60 * 60 * 24));
    if (daysInPast > 0) return; // Only allow today (daysInPast === 0)

    const dateStr = format(day, "yyyy-MM-dd");
    const nextValue = !markedDays[dateStr];

    console.log(`🖱️ Clicked ${dateStr}, setting to ${nextValue}`);

    // Optimistic update - instant feedback
    setMarkedDays((prev) => {
      const next = { ...prev };
      if (nextValue) {
        next[dateStr] = true;
      } else {
        delete next[dateStr];
      }
      return next;
    });

    setError(null);

    try {
      // Save in background without blocking UI
      await setHabitDay(dateStr, nextValue);
    } catch (saveError) {
      console.error("Failed to save habit day:", saveError);
      const errorMsg = saveError instanceof Error ? saveError.message : String(saveError);
      setError(`⚠️ Failed to save. ${errorMsg}`);

      // Revert optimistic update on error
      setMarkedDays((prev) => {
        const next = { ...prev };
        if (nextValue) {
          delete next[dateStr];
        } else {
          next[dateStr] = true;
        }
        return next;
      });
    }
  };

  const handleTodayClick = () => handleDayClick(today);
  const goToPreviousMonth = () => setCurrentMonth((prev) => {
    const nextDate = new Date(prev);
    nextDate.setMonth(nextDate.getMonth() - 1);
    return nextDate;
  });
  const goToNextMonth = () => setCurrentMonth((prev) => {
    const nextDate = new Date(prev);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  });

  const handleExport = async (fmt: "csv" | "json") => {
    setExporting(true);
    try {
      const res = await exportHabitData(fmt);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `habit-tracker-export.${fmt}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to export data");
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  if (!isLoaded) {
    return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Loading habit history...</div>;
  }

  const tabsConfig: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: "calendar", label: "Calendar", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "history", label: "Streak History", icon: <Flame className="w-4 h-4" /> },
    { id: "weekly", label: "Weekly Stats", icon: "📊" },
    { id: "time", label: "Best Time", icon: "⏰" },
    { id: "leetcode", label: "LeetCode", icon: "💻" },
    { id: "achievements", label: "Achievements", icon: "🏆" },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
      <Card className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white dark:bg-slate-950/90 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl transition-colors">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.14),_transparent_28%)]" />
        <CardContent className="relative space-y-8 px-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-300/20 mb-4">
                <Sparkles className="h-4 w-4" />
                Daily Habit Tracker
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-white sm:text-5xl">
                Keep your streak glowing.
              </h1>
            </div>
            <Button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              variant="ghost"
              size="icon"
              className="rounded-full"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-slate-600" />
              ) : (
                <Sun className="h-5 w-5 text-slate-400" />
              )}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-5 text-center shadow-lg shadow-slate-200/50 dark:shadow-slate-950/20 transition hover:-translate-y-1">
              <p className="text-sm uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Current streak</p>
              <p className="mt-3 text-3xl font-semibold text-black dark:text-white">{currentStreak}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-5 text-center shadow-lg shadow-slate-200/50 dark:shadow-slate-950/20 transition hover:-translate-y-1">
              <p className="text-sm uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Longest streak</p>
              <p className="mt-3 text-3xl font-semibold text-black dark:text-white">{longestStreak}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-5 text-center shadow-lg shadow-slate-200/50 dark:shadow-slate-950/20 transition hover:-translate-y-1">
              <p className="text-sm uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Monthly progress</p>
              <p className="mt-3 text-3xl font-semibold text-black dark:text-white">{completionPercent}%</p>
            </div>
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-5 text-center shadow-lg shadow-slate-200/50 dark:shadow-slate-950/20 transition hover:-translate-y-1">
              <p className="text-sm uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">LeetCode</p>
              <p className="mt-3 text-3xl font-semibold text-black dark:text-white">{leetcodeProblemCount}</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
            <TabsList className="grid w-full grid-cols-6 gap-0 bg-transparent rounded-none h-auto p-0">
              {tabsConfig.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="!rounded-none !border-0 !bg-transparent !shadow-none py-4 px-2 text-slate-600 dark:text-slate-400 data-[state=active]:text-cyan-500 dark:data-[state=active]:text-cyan-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-500 after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:origin-left"
                >
                  {typeof tab.icon === "string" ? <span className="text-lg">{tab.icon}</span> : tab.icon}
                  <span className="hidden sm:inline ml-2">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="mt-6 min-h-[400px]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-cyan-300/20 dark:border-cyan-300/10 bg-cyan-50 dark:bg-cyan-500/10 p-4 text-sm text-cyan-900 dark:text-cyan-100 ring-1 ring-cyan-200/30 dark:ring-cyan-200/20 transition-colors">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-cyan-950 dark:text-white">{trackedDays} days tracked</p>
                      <p className="text-cyan-700 dark:text-slate-300">Out of {daysThisMonth} days so far this month.</p>
                    </div>
                    <Button onClick={handleTodayClick} variant="ghost" size="sm" className="gap-2">
                      <Flame className="h-4 w-4" />
                      {markedDays[todayKey] ? "Unmark today" : "Mark today"}
                    </Button>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-cyan-200/30 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>

                <Card className="rounded-[2rem] border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-900/95 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Month view</p>
                        <CardTitle className="text-2xl font-semibold text-black dark:text-white">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 dark:bg-slate-800/80 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-white/10">
                        <CalendarDays className="h-4 w-4 text-cyan-500 dark:text-cyan-300" />
                        {daysInMonth.length} days
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={goToPreviousMonth} title="Previous month">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={goToNextMonth} title="Next month">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleExport("csv")} disabled={exporting} size="sm" variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          CSV
                        </Button>
                        <Button onClick={() => handleExport("json")} disabled={exporting} size="sm" variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          JSON
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-500 mb-3">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="flex h-8 items-center justify-center">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="aspect-square rounded-3xl bg-slate-100 dark:bg-slate-950/50" />;
                        }

                        const dateStr = format(day, "yyyy-MM-dd");
                        const isMarked = markedDays[dateStr];
                        const isTodayDate = isToday(day);
                        const isFutureDate = isFuture(day);
                        const daysInPast = Math.floor((today.getTime() - startOfDay(day).getTime()) / (1000 * 60 * 60 * 24));
                        const isClickable = !isFutureDate && daysInPast === 0;
                        const leetcodeCount = leetcodeProblemsByDate[dateStr] || 0;

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => handleDayClick(day)}
                            disabled={!isClickable}
                            className={`aspect-square rounded-3xl border p-0.5 transition-all duration-300 ${
                              !isClickable
                                ? "cursor-not-allowed bg-slate-100 dark:bg-slate-950/40 border-slate-300 dark:border-slate-800/50 opacity-35"
                                : "bg-white dark:bg-slate-950/90 border-slate-300 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-400/50 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                            } ${
                              isMarked ? "bg-gradient-to-br from-cyan-500 to-emerald-500 border-cyan-400/50 dark:border-cyan-400/50 shadow-lg shadow-cyan-500/25" : "text-slate-700 dark:text-slate-200"
                            } ${isTodayDate ? "ring-2 ring-cyan-300/70" : ""}`}
                          >
                            <span className="relative flex h-full w-full flex-col items-center justify-center text-sm font-semibold">
                              <span className={isMarked ? "text-white" : ""}>{format(day, "d")}</span>
                              {leetcodeCount > 0 && (
                                <span className={`text-xs mt-0.5 ${isMarked ? "text-cyan-100" : "text-cyan-600 dark:text-cyan-400"}`}>
                                  💻 {leetcodeCount}
                                </span>
                              )}
                              {isMarked && (
                                <svg
                                  className="absolute inset-0"
                                  viewBox="0 0 100 100"
                                  preserveAspectRatio="xMidYMid meet"
                                  style={{ animation: "drawLine 0.3s ease-out forwards" }}
                                >
                                  <style>{`
                                    @keyframes drawLine {
                                      from {
                                        stroke-dashoffset: 100;
                                      }
                                      to {
                                        stroke-dashoffset: 0;
                                      }
                                    }
                                  `}</style>
                                  <line
                                    x1="15"
                                    y1="50"
                                    x2="85"
                                    y2="50"
                                    stroke="white"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray="100"
                                    strokeDashoffset="100"
                                  />
                                </svg>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {error ? (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Other Tabs */}
            <TabsContent value="history" className="mt-6 min-h-[400px]">
              <StreakTimeline />
            </TabsContent>

            <TabsContent value="weekly" className="mt-6 min-h-[400px]">
              <WeeklyStats />
            </TabsContent>

            <TabsContent value="time" className="mt-6 min-h-[400px]">
              <TimeAnalysis />
            </TabsContent>

            <TabsContent value="leetcode" className="mt-6 min-h-[400px]">
              <LeetCodeTracker />
            </TabsContent>

            <TabsContent value="achievements" className="mt-6 min-h-[400px]">
              <Achievements />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
