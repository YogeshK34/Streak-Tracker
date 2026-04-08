"use client";

import { useEffect, useState, useMemo } from "react";
import { getAchievements, getHabitDays } from "@/app/services/habit";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-6">
      {/* Progress to next badge */}
      {progress.nextBadge && (
        <Card className="border-gradient-r from-cyan-300/20 to-emerald-300/20 dark:from-cyan-400/20 dark:to-emerald-400/20 bg-gradient-to-r from-cyan-50 to-emerald-50 dark:from-cyan-500/5 dark:to-emerald-500/5 p-6 border border-cyan-200 dark:border-cyan-400/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  {progress.nextBadge.icon} {progress.nextBadge.label}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{progress.nextBadge.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">Progress</p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {progress.progress} / {parseInt(progress.nextBadge.type.split("_")[1], 10)}
                </p>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
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
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {progress.remaining} more day{progress.remaining !== 1 ? "s" : ""} to go!
            </p>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-4 text-center">
          <p className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Current Streak</p>
          <p className="mt-2 text-3xl font-bold text-cyan-600 dark:text-cyan-400">{currentStreak}</p>
        </Card>
        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-4 text-center">
          <p className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Longest Streak</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{longestStreak}</p>
        </Card>
        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-4 text-center">
          <p className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Total Days</p>
          <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{totalDays}</p>
        </Card>
      </div>

      {/* Badges Grid */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Badges</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {BADGE_DEFINITIONS.map((badge) => {
            const isUnlocked = unlockedBadgeTypes.has(badge.type);
            const achievedDate = achievements.find((a) => a.badge_type === badge.type)?.achieved_date;

            return (
              <Card
                key={badge.type}
                className={`relative overflow-hidden border p-4 text-center transition-all ${
                  isUnlocked
                    ? "border-cyan-300 dark:border-cyan-400/30 bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-cyan-500/10 dark:to-emerald-500/10"
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 opacity-60"
                }`}
              >
                {isUnlocked && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                )}
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h4 className="font-semibold text-sm text-black dark:text-white">{badge.label}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{badge.description}</p>
                {isUnlocked && achievedDate && (
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2">
                    {new Date(achievedDate).toLocaleDateString()}
                  </p>
                )}
                {!isUnlocked && <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Locked</p>}
              </Card>
            );
          })}
        </div>
      </div>

      {achievements.length === 0 && (
        <Card className="border-slate-200 dark:border-white/10 bg-amber-50 dark:bg-amber-500/10 p-4 border border-amber-200 dark:border-amber-400/30">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            🚀 <strong>No badges yet!</strong> Keep up your habit and unlock your first badge today!
          </p>
        </Card>
      )}
    </div>
  );
}
