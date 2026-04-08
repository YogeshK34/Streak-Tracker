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

    console.log("📥 Fetching achievements for user:", user.id);

    // Get all achievements for this user
    const { data, error } = await supabase
      .from("achievements")
      .select("badge_type, achieved_date")
      .eq("user_id", user.id)
      .order("achieved_date", { ascending: false });

    if (error) {
      console.error("❌ Achievements query error:", error.message, error.details);
      // Return empty array instead of error to prevent UI failures
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    console.log("✅ Returning", data?.length || 0, "achievements for user", user.id);
    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error("Achievements fetch error:", error);
    // Return empty array on error to prevent UI failures
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
