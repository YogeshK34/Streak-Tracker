export interface BadgeDefinition {
  type: string;
  label: string;
  description: string;
  icon: string;
  condition: (currentStreak: number, totalDays: number, longestStreak: number) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: "streak_7",
    label: "Week Warrior",
    description: "7-day streak",
    icon: "🔥",
    condition: (current, total, longest) => current >= 7 || longest >= 7,
  },
  {
    type: "streak_14",
    label: "Fortnight Master",
    description: "14-day streak",
    icon: "💪",
    condition: (current, total, longest) => current >= 14 || longest >= 14,
  },
  {
    type: "streak_30",
    label: "Month Champion",
    description: "30-day streak",
    icon: "👑",
    condition: (current, total, longest) => current >= 30 || longest >= 30,
  },
  {
    type: "streak_100",
    label: "Centurion",
    description: "100-day streak",
    icon: "⭐",
    condition: (current, total, longest) => current >= 100 || longest >= 100,
  },
  {
    type: "total_100_days",
    label: "Hundreds Club",
    description: "100 total days tracked",
    icon: "💯",
    condition: (current, total, longest) => total >= 100,
  },
  {
    type: "total_365_days",
    label: "Year Long",
    description: "365 days tracked",
    icon: "🎉",
    condition: (current, total, longest) => total >= 365,
  },
  {
    type: "comeback",
    label: "Comeback Kid",
    description: "Restart after a break",
    icon: "🚀",
    condition: () => false, // Special: checked in API
  },
];

/**
 * Check which badges should be unlocked based on current stats
 * @param currentStreak - Current ongoing streak length
 * @param totalDays - Total days ever marked
 * @param longestStreak - Longest streak ever achieved
 * @param unlockedBadges - Set of already unlocked badge types
 * @returns Array of newly unlocked badge types
 */
export function checkAchievements(
  currentStreak: number,
  totalDays: number,
  longestStreak: number,
  unlockedBadges: Set<string>
): string[] {
  const newBadges: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (badge.type === "comeback") continue; // Special handling
    if (unlockedBadges.has(badge.type)) continue; // Already unlocked

    if (badge.condition(currentStreak, totalDays, longestStreak)) {
      newBadges.push(badge.type);
    }
  }

  return newBadges;
}

/**
 * Get badge info by type
 */
export function getBadgeInfo(type: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.type === type);
}

/**
 * Calculate progress to next badge
 */
export function getProgressToNextBadge(
  currentStreak: number,
  longestStreak: number
): {
  nextBadge: BadgeDefinition | null;
  progress: number;
  remaining: number;
} {
  const streakBadges = BADGE_DEFINITIONS.filter(
    (b) => b.type.startsWith("streak_") && b.type !== "comeback"
  );
  streakBadges.sort(
    (a, b) =>
      parseInt(a.type.split("_")[1]) - parseInt(b.type.split("_")[1])
  );

  for (const badge of streakBadges) {
    const targetStreak = parseInt(badge.type.split("_")[1], 10);
    if (currentStreak < targetStreak && longestStreak < targetStreak) {
      return {
        nextBadge: badge,
        progress: currentStreak,
        remaining: targetStreak - currentStreak,
      };
    }
  }

  return { nextBadge: null, progress: currentStreak, remaining: 0 };
}
