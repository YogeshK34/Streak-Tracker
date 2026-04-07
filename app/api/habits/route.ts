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

    if (marked) {
      console.log(`✏️ Upserting: user_id=${user.id}, tracked_date=${date}`);
      const { error, data: upsertData } = await supabase.from("habit_entries").upsert(
        [{ user_id: user.id, tracked_date: date }],
        { onConflict: "user_id,tracked_date" }
      );

      if (error) {
        console.error("❌ Upsert failed:", error.message, error.details);
        return NextResponse.json({ error: error.message }, { status: 500 });
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

    console.log("✅ Deleted successfully:", deleteData);
    return NextResponse.json({ data: { date, marked } }, { status: 200 });
  } catch (error) {
    console.error("❌ Habit update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
