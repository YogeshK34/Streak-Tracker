import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
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

    const { streakCount } = await req.json();

    if (!streakCount || typeof streakCount !== "number") {
      return NextResponse.json(
        { error: "Invalid streakCount" },
        { status: 400 }
      );
    }

    const prompt = `Generate a short motivational quote (max 2 lines) for a developer
who just hit a ${streakCount} day coding streak.
Make it punchy, specific to the number, and developer-flavored.
No hashtags. No generic advice. Just the quote, nothing else.`;

    const { text: quote } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

    return NextResponse.json({ quote: quote.trim() }, { status: 200 });
  } catch (error) {
    console.error("AI motivation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
