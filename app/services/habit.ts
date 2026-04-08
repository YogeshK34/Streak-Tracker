import { supabase } from "@/lib/supabase-client";

export type HabitDay = {
  date: string;
};

export type StreakHistory = {
  start_date: string;
  end_date: string;
  length: number;
};

export type WeeklyStatItem = {
  week_start: string;
  days_completed: number;
  days_possible: number;
};

export type Achievement = {
  badge_type: string;
  achieved_date: string;
};

export type TimeAnalysis = {
  hour: number;
  count: number;
};

async function getAuthToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) {
    console.error("❌ Auth error:", error?.message || "No session");
    throw new Error("Not authenticated");
  }
  console.log("✅ Got auth token for user:", session.user.id);
  return session.access_token;
}

export async function getHabitDays() {
  try {
    const token = await getAuthToken();
    console.log("📥 Fetching habit days...");
    const res = await fetch("/api/habits", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({error: `HTTP ${res.status}`}));
      console.error("❌ Fetch failed:", res.status, error);
      throw new Error(`Failed to fetch habit data: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Fetched habits:", json.data?.length || 0, "days");
    return json as Promise<{ data: HabitDay[] }>;
  } catch (error) {
    console.error("❌ getHabitDays error:", error);
    throw error;
  }
}

export async function setHabitDay(date: string, marked: boolean) {
  try {
    const token = await getAuthToken();
    console.log(`📤 Saving ${marked ? "✓" : "✗"} for ${date}...`);
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date, marked }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({error: `HTTP ${res.status}`}));
      console.error("❌ Save failed:", res.status, error);
      throw new Error(`Failed to update habit data: ${res.status} - ${JSON.stringify(error)}`);
    }

    const json = await res.json();
    console.log("✅ Saved successfully:", json);
    return json;
  } catch (error) {
    console.error("❌ setHabitDay error:", error);
    throw error;
  }
}

export async function getStreakHistory() {
  try {
    const token = await getAuthToken();
    console.log("📥 Fetching streak history...");
    const res = await fetch("/api/habits/history", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch streak history: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Fetched streaks:", json.data?.length || 0);
    return json as Promise<{ data: StreakHistory[] }>;
  } catch (error) {
    console.error("❌ getStreakHistory error:", error);
    throw error;
  }
}

export async function getWeeklyStats(year: number, weekStart: string) {
  try {
    const token = await getAuthToken();
    console.log(`📥 Fetching weekly stats for ${weekStart}...`);
    const res = await fetch(`/api/habits/weekly?year=${year}&weekStart=${weekStart}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch weekly stats: ${res.status}`);
    }

    const json = await res.json();
    return json as Promise<{ data: WeeklyStatItem[] }>;
  } catch (error) {
    console.error("❌ getWeeklyStats error:", error);
    throw error;
  }
}

export async function getCompletionTimeAnalysis() {
  try {
    const token = await getAuthToken();
    console.log("📥 Fetching time analysis...");
    const res = await fetch("/api/habits/time-analysis", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch time analysis: ${res.status}`);
    }

    const json = await res.json();
    return json as Promise<{ data: TimeAnalysis[] }>;
  } catch (error) {
    console.error("❌ getCompletionTimeAnalysis error:", error);
    throw error;
  }
}

export async function getAchievements() {
  try {
    const token = await getAuthToken();
    console.log("📥 Fetching achievements...");
    const res = await fetch("/api/habits/achievements", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch achievements: ${res.status}`);
    }

    const json = await res.json();
    return json as Promise<{ data: Achievement[] }>;
  } catch (error) {
    console.error("❌ getAchievements error:", error);
    throw error;
  }
}

export async function exportHabitData(format: "csv" | "json") {
  try {
    const token = await getAuthToken();
    console.log(`📥 Exporting habits as ${format}...`);
    const res = await fetch(`/api/habits/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to export data: ${res.status}`);
    }

    return res;
  } catch (error) {
    console.error("❌ exportHabitData error:", error);
    throw error;
  }
}
