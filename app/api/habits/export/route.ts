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

    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      total_days_tracked: habits?.length || 0,
      habit_entries: habits || [],
      streak_history: streaks || [],
      achievements: achievements || [],
    };

    if (format === "csv") {
      // Generate CSV
      let csv = "Habit Tracker Export\n";
      csv += `Export Date: ${exportData.export_date}\n\n`;

      csv += "HABIT ENTRIES\n";
      csv += "Date\n";
      (habits || []).forEach((h: any) => {
        csv += `${h.tracked_date}\n`;
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
