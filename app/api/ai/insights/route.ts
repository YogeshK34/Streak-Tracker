/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  console.log("📍 [insights/route] POST handler started");

  try {
    console.log("✅ [insights] GROQ_API_KEY available:", Boolean(process.env.GROQ_API_KEY));

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("❌ [insights] No auth header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ [insights] Token validation failed:", userError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ [insights] Auth verified for user:", user.id);

    // Fetch habit entries
    const { data: habitEntries, error: habitError } = await supabase
      .from("habit_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("tracked_date", { ascending: false })
      .limit(90);

    console.log("📊 [insights] Habit entries query result:", {
      success: !habitError,
      count: habitEntries?.length || 0,
      error: habitError?.message,
    });

    // Fetch streak history (optional)
    const { data: streakHistory, error: streakError } = await supabase
      .from("streak_history")
      .select("*")
      .eq("user_id", user.id)
      .order("end_date", { ascending: false })
      .limit(20);

    console.log("📊 [insights] Streak history query result:", {
      success: !streakError,
      count: streakHistory?.length || 0,
      error: streakError?.message,
    });

    // Only fail if habit_entries failed (streak_history is optional)
    if (habitError) {
      console.error("❌ [insights] Habit query failed");
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    // Build context string - HABIT DATA ONLY
    const habitContext =
      habitEntries && habitEntries.length > 0
        ? `Recent 90 days of habit data: ${habitEntries.length} days tracked. Dates: ${habitEntries.map((h: any) => h.tracked_date).join(", ")}`
        : "No habit data available";

    const streakContext =
      streakHistory && streakHistory.length > 0
        ? `Streak history: ${streakHistory
            .map(
              (s: any) =>
                `Streak from ${s.start_date} to ${s.end_date}: ${s.length} days`
            )
            .join("; ")}`
        : "No streak history available";

    const userContext = `${habitContext}\n\n${streakContext}`;

    console.log("📝 [insights] Context built, length:", userContext.length);

    const systemPrompt =
      "You are a habit tracking coach. Analyze this developer's daily habit tracking data. Focus on: streaks, consistency patterns (which days of week they track most), drops offs, and overall commitment. Be specific and data-driven. Keep response under 150 words. Use plain text, no markdown.";

    console.log("🤖 [insights] Calling streamText with Groq model...");

    // Stream the response
    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: userContext,
    });

    console.log("✅ [insights] streamText returned successfully");
    console.log("🔄 [insights] Converting to text stream response...");

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("❌ [insights] Full error caught:");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A");
    console.error("Full error object:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
