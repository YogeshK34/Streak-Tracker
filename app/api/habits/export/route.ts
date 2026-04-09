/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const format = req.nextUrl.searchParams.get("format") || "json";

    // Get all habit entries, streak history, and achievements
    const [{ data: habits }, { data: streaks }, { data: achievements }] = await Promise.all([
      supabase
        .from("habit_entries")
        .select("tracked_date")
        .eq("user_id", user.id)
        .order("tracked_date", { ascending: true }),
      supabase
        .from("streak_history")
        .select("start_date, end_date, length")
        .eq("user_id", user.id)
        .order("end_date", { ascending: false }),
      supabase
        .from("achievements")
        .select("badge_type, achieved_date")
        .eq("user_id", user.id),
    ]);

    // Calculate statistics
    const totalDaysTracked = habits?.length || 0;

    // Calculate current streak: consecutive days ending at the most recent marked date
    let currentStreak = 0;
    if (habits && habits.length > 0) {
      const sortedHabits = habits.sort((a: any, b: any) =>
        new Date(b.tracked_date).getTime() - new Date(a.tracked_date).getTime()
      );
      const mostRecentDate = new Date(sortedHabits[0].tracked_date);

      // Count consecutive marked days backwards from the most recent date
      let streak = 0;
      let currentDate = new Date(mostRecentDate);
      const markedSet = new Set(habits.map((h: any) => h.tracked_date));

      while (markedSet.has(currentDate.toISOString().split('T')[0])) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
      currentStreak = streak;
    }

    // Longest streak is the longest duration from streak_history table
    const longestStreak = streaks?.[0]?.length || currentStreak;
    const totalAchievements = achievements?.length || 0;

    const exportData = {
      metadata: {
        export_date: new Date().toISOString(),
        export_date_readable: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        user_id: user.id,
        app_version: "1.0",
      },
      summary: {
        total_days_tracked: totalDaysTracked,
        current_streak_days: currentStreak,
        longest_streak_days: longestStreak,
        total_achievements: totalAchievements,
      },
      data: {
        habit_entries: habits || [],
        streak_history: streaks || [],
        achievements: achievements || [],
      },
    };

    if (format === "csv") {
      // Generate CSV with headers and summary
      let csv = "HABIT TRACKER EXPORT\n";
      csv += `Generated: ${exportData.metadata.export_date_readable}\n`;
      csv += `User ID: ${exportData.metadata.user_id}\n\n`;

      csv += "SUMMARY\n";
      csv += `Total Days Tracked,${exportData.summary.total_days_tracked}\n`;
      csv += `Current Streak,${exportData.summary.current_streak_days} days\n`;
      csv += `Longest Streak,${exportData.summary.longest_streak_days} days\n`;
      csv += `Total Achievements,${exportData.summary.total_achievements}\n\n`;

      csv += "HABIT ENTRIES\n";
      csv += "Date\n";
      (habits || []).forEach((h: any) => {
        const dateObj = new Date(h.tracked_date);
        const readable = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        csv += `${h.tracked_date} (${readable})\n`;
      });

      csv += "\nSTREAK HISTORY\n";
      csv += "Start Date,End Date,Length (days)\n";
      (streaks || []).forEach((s: any) => {
        csv += `${s.start_date},${s.end_date},${s.length}\n`;
      });

      csv += "\nACHIEVEMENTS\n";
      csv += "Badge Type,Achieved Date\n";
      (achievements || []).forEach((a: any) => {
        csv += `${a.badge_type},${a.achieved_date}\n`;
      });

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="habit-tracker-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else {
      // JSON format (default)
      return NextResponse.json(exportData, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="habit-tracker-export-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
