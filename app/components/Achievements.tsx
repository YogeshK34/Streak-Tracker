"use client";

import { useEffect, useState, useMemo } from "react";
import { getAchievements, getHabitDays } from "@/app/services/habit";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BADGE_DEFINITIONS, getProgressToNextBadge } from "@/lib/achievement-checker";
import { calculateCurrentStreak, calculateStreaksBetween } from "@/lib/streak-calculator";

interface Achievement {
  badge_type: string;
  achieved_date: string;
}

export function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAchievements(), getHabitDays()])
      .then(([achievementsRes, habitsRes]) => {
        console.log("✅ Achievements loaded:", achievementsRes.data);
        console.log("✅ Habits loaded:", habitsRes.data.length, "days");
        setAchievements(achievementsRes.data);

        const markedDays = habitsRes.data.map((d) => d.date);
        setTotalDays(markedDays.length);
        setCurrentStreak(calculateCurrentStreak(markedDays));

        const streaks = calculateStreaksBetween(markedDays);
        if (streaks.length > 0) {
          setLongestStreak(Math.max(...streaks.map((s) => s.length)));
        }
      })
      .catch((err) => {
        console.error("❌ Failed to load achievements:", err);
        setError(`Unable to load achievements: ${err instanceof Error ? err.message : String(err)}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const unlockedBadgeTypes = useMemo(() => new Set(achievements.map((a) => a.badge_type)), [achievements]);

  const progress = useMemo(() => {
    return getProgressToNextBadge(currentStreak, longestStreak);
  }, [currentStreak, longestStreak]);

  if (loading) {
    return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Loading achievements...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-rose-600 dark:text-rose-400">{error}</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress to next badge */}
      {progress.nextBadge && (
        <Card className="border-gradient-r from-cyan-300/20 to-emerald-300/20 dark:from-cyan-400/20 dark:to-emerald-400/20 bg-gradient-to-r from-cyan-50 to-emerald-50 dark:from-cyan-500/5 dark:to-emerald-500/5 p-4 sm:p-6 border border-cyan-200 dark:border-cyan-400/30">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white break-words">
                  {progress.nextBadge.icon} {progress.nextBadge.label}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{progress.nextBadge.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {progress.progress} / {parseInt(progress.nextBadge.type.split("_")[1], 10)}
                </p>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 sm:h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.min(
                    (progress.progress / parseInt(progress.nextBadge.type.split("_")[1], 10)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {progress.remaining} more day{progress.remaining !== 1 ? "s" : ""} to go!
            </p>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Current Streak</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400">{currentStreak}</p>
        </Card>
        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Longest Streak</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{longestStreak}</p>
        </Card>
        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Total Days</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{totalDays}</p>
        </Card>
      </div>

      {/* Badges Grid */}
      <div>
        <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-black dark:text-white">Badges</h3>
        <TooltipProvider>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {BADGE_DEFINITIONS.map((badge) => {
              const isUnlocked = unlockedBadgeTypes.has(badge.type);
              const achievedDate = achievements.find((a) => a.badge_type === badge.type)?.achieved_date;

              return (
                <Tooltip key={badge.type}>
                  <TooltipTrigger asChild>
                    <Card
                      className={`relative overflow-hidden border p-3 sm:p-4 text-center transition-all cursor-help ${
                        isUnlocked
                          ? "border-cyan-300 dark:border-cyan-400/30 bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-cyan-500/10 dark:to-emerald-500/10"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 opacity-60"
                      }`}
                    >
                      {isUnlocked && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                      )}
                      <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{badge.icon}</div>
                      <h4 className="font-semibold text-xs sm:text-sm text-black dark:text-white line-clamp-2">{badge.label}</h4>
                      {isUnlocked && achievedDate && (
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                          {new Date(achievedDate).toLocaleDateString()}
                        </p>
                      )}
                      {!isUnlocked && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Locked</p>}
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{badge.label}</p>
                      <p className="text-xs">{badge.description}</p>
                      {!isUnlocked && (
                        <p className="text-xs text-amber-200">
                          {badge.type.includes("_") && badge.type.split("_")[1]
                            ? `Unlock at ${badge.type.split("_")[1]} days`
                            : "Keep going!"}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {achievements.length === 0 && (
        <Card className="border-slate-200 dark:border-white/10 bg-amber-50 dark:bg-amber-500/10 p-3 sm:p-4 border border-amber-200 dark:border-amber-400/30">
          <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100">
            🚀 <strong>No badges yet!</strong> Keep up your habit and unlock your first badge today!
          </p>
        </Card>
      )}
    </div>
  );
}
