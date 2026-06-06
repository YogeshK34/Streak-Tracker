/*eslint-disable*/

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

interface Suggestion {
  problem_name: string;
  reason: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

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

    // Fetch LeetCode problems
    const { data: leetcodeProblems, error: leetcodeError } = await supabase
      .from("leetcode_problems")
      .select("problem_name, data_structure, technique")
      .eq("user_id", user.id)
      .order("problem_date", { ascending: false })
      .limit(50);

    if (leetcodeError) {
      return NextResponse.json(
        { error: "Failed to fetch problems" },
        { status: 500 }
      );
    }

    const problemContext =
      leetcodeProblems && leetcodeProblems.length > 0
        ? leetcodeProblems
            .map(
              (p: any) =>
                `${p.problem_name} (DS: ${p.data_structure}, Techniques: ${p.technique?.join(", ") || "N/A"})`
            )
            .join("; ")
        : "No problems recorded yet";

    const prompt = `Based on these solved LeetCode problems, suggest 3 problems to practice next.
Focus on underrepresented techniques and data structures in the user's history.
Return ONLY a valid JSON array. No explanation. No markdown. No backticks.

User's problems: ${problemContext}

Format:
[
  { "problem_name": "...", "reason": "...", "difficulty": "Easy | Medium | Hard" },
  { "problem_name": "...", "reason": "...", "difficulty": "Easy | Medium | Hard" },
  { "problem_name": "...", "reason": "...", "difficulty": "Easy | Medium | Hard" }
]`;

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

    // Parse JSON response
    let suggestions: Suggestion[];
    try {
      suggestions = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse suggestions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: suggestions }, { status: 200 });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
