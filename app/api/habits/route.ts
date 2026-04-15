import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateStreaksBetween, calculateCurrentStreak, detectStreakChange } from "@/lib/streak-calculator";
import { checkAchievements } from "@/lib/achievement-checker";
import { format, startOfDay } from "date-fns";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Get the session from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("❌ No auth header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ Token validation failed:", userError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Auth verified for user:", user.id);

    // Get habit entries for this user
    const { data, error } = await supabase
      .from("habit_entries")
      .select("tracked_date")
      .eq("user_id", user.id)
      .order("tracked_date", { ascending: true });

    if (error) {
      console.error("❌ Query error:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map tracked_date to date for consistency
    const mappedData = (data ?? []).map((item: any) => ({
      date: item.tracked_date,
    }));

    console.log("✅ Returning", mappedData.length, "habits for user", user.id);
    return NextResponse.json({ data: mappedData }, { status: 200 });
  } catch (error) {
    console.error("Habit fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("❌ No auth header on POST");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ POST Token validation failed:", userError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, marked } = body;

    console.log(`📝 POST request: user=${user.id}, date=${date}, marked=${marked}`);

    if (!date || typeof marked !== "boolean") {
      console.error("❌ Invalid body:", { date, marked });
      return NextResponse.json(
        { error: "Date and marked flag are required" },
        { status: 400 }
      );
    }

    // Get current habit data for streak detection
    const { data: allHabits, error: fetchError } = await supabase
      .from("habit_entries")
      .select("tracked_date")
      .eq("user_id", user.id)
      .order("tracked_date", { ascending: true });

    if (fetchError) {
      console.error("❌ Failed to fetch current habits:", fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const oldMarkedDays = (allHabits ?? []).map((h: any) => h.tracked_date);

    if (marked) {
      console.log(`✏️ Upserting: user_id=${user.id}, tracked_date=${date}`);

      // Store completion time (current hour)
      const now = new Date();
      const completionHour = now.getHours();

      const { error, data: upsertData } = await supabase.from("habit_entries").upsert(
        [{ user_id: user.id, tracked_date: date, completion_hour: completionHour }],
        { onConflict: "user_id,tracked_date" }
      );

      if (error) {
        console.error("❌ Upsert failed:", error.message, error.details);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`📝 Recording completion time: hour=${completionHour}`);

      // Calculate new marked days for streak detection
      const newMarkedDays = [...oldMarkedDays, date].sort();

      // Check for new achievements
      const { data: existingAchievements, error: achievementFetchError } = await supabase
        .from("achievements")
        .select("badge_type")
        .eq("user_id", user.id);

      if (!achievementFetchError) {
        const unlockedBadges = new Set((existingAchievements ?? []).map((a: any) => a.badge_type));
        const currentStreak = calculateCurrentStreak(newMarkedDays);
        const totalDays = newMarkedDays.length;
        const streaks = calculateStreaksBetween(newMarkedDays);
        const longestStreak = streaks.length > 0 ? Math.max(...streaks.map(s => s.length)) : 0;

        const newBadges = checkAchievements(currentStreak, totalDays, longestStreak, unlockedBadges);

        // Save new achievements
        if (newBadges.length > 0) {
          console.log(`🎉 New achievements unlocked:`, newBadges);
          for (const badge of newBadges) {
            const { error: badgeError } = await supabase.from("achievements").insert({
              user_id: user.id,
              badge_type: badge,
              achieved_date: new Date().toISOString(),
            });

            if (badgeError) {
              console.warn(`⚠️ Failed to save badge ${badge}:`, badgeError.message);
            }
          }
        }
      }

      console.log("✅ Upserted successfully:", upsertData);
      return NextResponse.json({ data: { date, marked } }, { status: 200 });
    }

    console.log(`🗑️ Deleting: user_id=${user.id}, tracked_date=${date}`);
    const { error, data: deleteData } = await supabase
      .from("habit_entries")
      .delete()
      .eq("user_id", user.id)
      .eq("tracked_date", date);

    if (error) {
      console.error("❌ Delete failed:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if a streak ended when unmarking
    const newMarkedDays = oldMarkedDays.filter((d: string) => d !== date);
    const oldStreaks = calculateStreaksBetween(oldMarkedDays);
    const newStreaks = calculateStreaksBetween(newMarkedDays);

    // Compare old streaks to new streaks to detect which ones ended
    for (const oldStreak of oldStreaks) {
      // Check if this streak was in the old data but is broken/missing in the new data
      const streakStillExists = newStreaks.some(
        (newStreak) =>
          newStreak.start_date === oldStreak.start_date &&
          newStreak.end_date === oldStreak.end_date &&
          newStreak.length === oldStreak.length
      );

      if (!streakStillExists) {
        // This streak was broken, save it to history
        console.log(`📊 Streak ended: ${oldStreak.length} days (${oldStreak.start_date} to ${oldStreak.end_date})`);
        const { error: streakError } = await supabase.from("streak_history").insert({
          user_id: user.id,
          start_date: oldStreak.start_date,
          end_date: oldStreak.end_date,
          length: oldStreak.length,
        });

        if (streakError) {
          console.warn("⚠️ Failed to save streak to history:", streakError.message);
        }
      }
    }

    console.log("✅ Deleted successfully:", deleteData);
    return NextResponse.json({ data: { date, marked } }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ Habit update error:", errorMsg);
    console.error("Full error:", error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
