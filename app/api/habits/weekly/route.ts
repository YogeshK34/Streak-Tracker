import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { startOfWeek, addWeeks, format } from "date-fns";

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

    // Get all habit entries for this user
    const { data: habits, error: habitsError } = await supabase
      .from("habit_entries")
      .select("tracked_date")
      .eq("user_id", user.id)
      .order("tracked_date", { ascending: true });

    if (habitsError) {
      console.error("❌ Habits query error:", habitsError.message);
      return NextResponse.json({ error: habitsError.message }, { status: 500 });
    }

    const habitSet = new Set((habits ?? []).map((h: any) => h.tracked_date));

    // Calculate weekly stats for all weeks with data
    const weeklyStats: Array<{
      week_start: string;
      days_completed: number;
      days_possible: number;
    }> = [];

    if (habits && habits.length > 0) {
      const firstDate = new Date((habits[0] as any).tracked_date);
      const today = new Date();

      let currentWeekStart = startOfWeek(firstDate, { weekStartsOn: 1 }); // Monday start

      while (currentWeekStart <= today) {
        let completed = 0;
        let possible = 0;

        // Count days in this week
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentWeekStart);
          date.setDate(date.getDate() + i);

          if (date > today) break;

          possible++;
          const dateStr = format(date, "yyyy-MM-dd");
          if (habitSet.has(dateStr)) {
            completed++;
          }
        }

        if (possible > 0) {
          weeklyStats.push({
            week_start: format(currentWeekStart, "yyyy-MM-dd"),
            days_completed: completed,
            days_possible: possible,
          });
        }

        currentWeekStart = addWeeks(currentWeekStart, 1);
      }
    }

    console.log("✅ Returning", weeklyStats.length, "weeks of stats for user", user.id);
    return NextResponse.json({ data: weeklyStats }, { status: 200 });
  } catch (error) {
    console.error("Weekly stats fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
