import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const { data, error } = await supabase
      .from("leetcode_problems")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Query error:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Returning", data?.length || 0, "problems for user", user.id);
    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error("LeetCode fetch error:", error);
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
    const { problem_date, problem_name, description } = body;

    console.log(
      `📝 POST request: user=${user.id}, problem=${problem_name}, date=${problem_date}`
    );

    if (!problem_date || !problem_name) {
      console.error("❌ Invalid body:", { problem_date, problem_name });
      return NextResponse.json(
        { error: "Problem date and name are required" },
        { status: 400 }
      );
    }

    const { error, data: insertData } = await supabase
      .from("leetcode_problems")
      .insert([
        {
          user_id: user.id,
          problem_date,
          problem_name,
          description: description || null,
        },
      ]);

    if (error) {
      console.error("❌ Insert failed:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Inserted successfully:", insertData);
    return NextResponse.json(
      { data: insertData },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ LeetCode create error:", errorMsg);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("❌ No auth header on PUT");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ PUT Token validation failed:", userError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, problem_date, problem_name, description } = body;

    console.log(`📝 PUT request: id=${id}, user=${user.id}`);

    if (!id || !problem_date || !problem_name) {
      console.error("❌ Invalid body:", { id, problem_date, problem_name });
      return NextResponse.json(
        { error: "ID, date, and name are required" },
        { status: 400 }
      );
    }

    const { error, data: updateData } = await supabase
      .from("leetcode_problems")
      .update({
        problem_date,
        problem_name,
        description: description || null,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Update failed:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Updated successfully:", updateData);
    return NextResponse.json(
      { data: updateData },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ LeetCode update error:", errorMsg);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("❌ No auth header on DELETE");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ DELETE Token validation failed:", userError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    console.log(`📝 DELETE request: id=${id}, user=${user.id}`);

    if (!id) {
      console.error("❌ ID is required");
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const { error, data: deleteData } = await supabase
      .from("leetcode_problems")
      .delete()
      .eq("id", parseInt(id))
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Delete failed:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Deleted successfully:", deleteData);
    return NextResponse.json(
      { data: deleteData },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ LeetCode delete error:", errorMsg);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
