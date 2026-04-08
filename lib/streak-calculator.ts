import { format, subDays, startOfDay } from "date-fns";

export interface Streak {
  start_date: string;
  end_date: string;
  length: number;
}

/**
 * Calculate all streaks from a set of marked days
 * @param markedDays - Array of date strings (yyyy-MM-dd format)
 * @returns Array of Streak objects
 */
export function calculateStreaksBetween(markedDays: string[]): Streak[] {
  if (markedDays.length === 0) return [];

  const sortedDates = markedDays
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  const streaks: Streak[] = [];
  let currentStreakStart = sortedDates[0];
  let currentStreakEnd = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];
    const dayDiff = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      // Consecutive day, extend streak
      currentStreakEnd = currDate;
    } else {
      // Gap found, save current streak and start new one
      streaks.push({
        start_date: format(currentStreakStart, "yyyy-MM-dd"),
        end_date: format(currentStreakEnd, "yyyy-MM-dd"),
        length:
          Math.floor(
            (currentStreakEnd.getTime() - currentStreakStart.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1,
      });
      currentStreakStart = currDate;
      currentStreakEnd = currDate;
    }
  }

  // Don't forget the last streak
  streaks.push({
    start_date: format(currentStreakStart, "yyyy-MM-dd"),
    end_date: format(currentStreakEnd, "yyyy-MM-dd"),
    length:
      Math.floor(
        (currentStreakEnd.getTime() - currentStreakStart.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1,
  });

  return streaks;
}

/**
 * Detect if a streak ended when transitioning from old days to new days
 * @returns Object with streak info if ended, or null
 */
export function detectStreakChange(
  oldMarkedDays: string[],
  newMarkedDays: string[]
): { endedStreak: Streak | null; newStreakStarted: boolean } {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const yesterday = format(subDays(startOfDay(new Date()), 1), "yyyy-MM-dd");

  // Check if today or yesterday was unmarked (streak break)
  const hadTodayOld = oldMarkedDays.includes(today);
  const hasTodayNew = newMarkedDays.includes(today);
  const hadYesterdayOld = oldMarkedDays.includes(yesterday);

  // Streak ended if: we had a streak going (yesterday was marked) and now we broke it (unmarked today)
  if (hadYesterdayOld && hadTodayOld && !hasTodayNew) {
    // Calculate the streak that just ended
    const oldStreaks = calculateStreaksBetween(oldMarkedDays);
    const endedStreak = oldStreaks.find((s) => s.end_date === today);

    if (endedStreak) {
      return { endedStreak, newStreakStarted: false };
    }
  }

  // New streak started if: we just marked today and yesterday was not marked
  if (!hadTodayOld && hasTodayNew && !hadYesterdayOld) {
    return { endedStreak: null, newStreakStarted: true };
  }

  return { endedStreak: null, newStreakStarted: false };
}

/**
 * Calculate the current streak length from marked days
 */
export function calculateCurrentStreak(markedDays: string[]): number {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  let streak = 0;
  let currentDate = new Date(today);

  while (true) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    if (markedDays.includes(dateStr)) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get statistics for a specific week
 */
export function calculateWeeklyStats(
  markedDays: string[],
  weekStartDate: Date
): { week_start: string; days_completed: number; days_possible: number } {
  const weekStart = startOfDay(weekStartDate);
  const daySet = new Set(markedDays);
  let completed = 0;
  let possible = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);

    // Only count past days
    if (date <= new Date()) {
      possible++;
      if (daySet.has(format(date, "yyyy-MM-dd"))) {
        completed++;
      }
    }
  }

  return {
    week_start: format(weekStart, "yyyy-MM-dd"),
    days_completed: completed,
    days_possible: possible,
  };
}

/**
 * Get hour distribution from completion times
 */
export function calculateTimeDistribution(
  completionTimes: Array<{ completion_hour: number }>
): Record<number, number> {
  const distribution: Record<number, number> = {};

  for (let hour = 0; hour < 24; hour++) {
    distribution[hour] = 0;
  }

  completionTimes.forEach((ct) => {
    distribution[ct.completion_hour]++;
  });

  return distribution;
}

/**
 * Find the most likely completion hour
 */
export function getBestCompletionTime(
  distribution: Record<number, number>
): { hour: number; count: number; label: string } | null {
  let bestHour = 0;
  let maxCount = 0;

  for (const [hourStr, count] of Object.entries(distribution)) {
    if (count > maxCount) {
      maxCount = count;
      bestHour = parseInt(hourStr, 10);
    }
  }

  if (maxCount === 0) return null;

  const pmLabel = bestHour >= 12 ? "PM" : "AM";
  const displayHour = bestHour > 12 ? bestHour - 12 : bestHour || 12;

  return {
    hour: bestHour,
    count: maxCount,
    label: `${displayHour}:00 ${pmLabel}`,
  };
}
