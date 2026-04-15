import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateStreaksBetween } from "@/lib/streak-calculator";
import { format, startOfDay } from "date-fns";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log("📥 Fetching streak history for user:", user.id);

    // Get all marked habit entries for this user
    const { data: habits, error } = await supabase
      .from("habit_entries")
      .select("tracked_date")
      .eq("user_id", user.id)
      .order("tracked_date", { ascending: true });

    if (error) {
      console.error("❌ Habit entries query error:", error.message, error.details);
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const markedDays = (habits ?? []).map((h: any) => h.tracked_date);
    const allStreaks = calculateStreaksBetween(markedDays);

    // Filter out the current active streak (the one that includes today)
    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    const completedStreaks = allStreaks.filter((streak) => streak.end_date !== today);

    // Sort by end_date descending (most recent first)
    completedStreaks.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

    console.log("✅ Returning", completedStreaks.length, "completed streaks for user", user.id);
    return NextResponse.json({ data: completedStreaks }, { status: 200 });
  } catch (error) {
    console.error("Streak history fetch error:", error);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
