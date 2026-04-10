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

    console.log("📥 Fetching time analysis for user:", user.id);

    // Get completion hours from habit entries
    const { data, error } = await supabase
      .from("habit_entries")
      .select("completion_hour")
      .eq("user_id", user.id)
      .not("completion_hour", "is", null);

    if (error) {
      console.error("❌ Time analysis query error:", error.message, error.details);
      // Return empty array with all hours initialized to 0
      const timeAnalysis = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
      }));
      return NextResponse.json({ data: timeAnalysis }, { status: 200 });
    }

    // Aggregate by hour
    const distribution: Record<number, number> = {};
    for (let hour = 0; hour < 24; hour++) {
      distribution[hour] = 0;
    }

    (data ?? []).forEach((entry: any) => {
      if (entry.completion_hour !== null) {
        distribution[entry.completion_hour]++;
      }
    });

    // Convert to array format
    const timeAnalysis = Object.entries(distribution).map(([hour, count]) => ({
      hour: parseInt(hour, 10),
      count: count as number,
    }));

    console.log("✅ Returning time analysis for user", user.id);
    return NextResponse.json({ data: timeAnalysis }, { status: 200 });
  } catch (error) {
    console.error("Time analysis fetch error:", error);
    // Return default empty hours on error
    const timeAnalysis = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
    }));
    return NextResponse.json({ data: timeAnalysis }, { status: 200 });
  }
}
