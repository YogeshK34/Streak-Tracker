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
      .from("ds_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Query error:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Returning", data?.length || 0, "DS notes for user", user.id);
    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error("DS notes fetch error:", error);
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

    const body = await req.json();
    const { ds_name, concept_name, notes } = body;

    if (!ds_name || !concept_name || !notes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`📝 Adding DS note for user ${user.id}: ${concept_name} in ${ds_name}`);

    const { data, error } = await supabase
      .from("ds_notes")
      .insert([
        {
          user_id: user.id,
          ds_name,
          concept_name,
          notes,
        },
      ])
      .select();

    if (error) {
      console.error("❌ Insert error:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ DS note added successfully");
    return NextResponse.json({ data: data?.[0] }, { status: 201 });
  } catch (error) {
    console.error("DS notes create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { id, ds_name, concept_name, notes } = body;

    if (!id || !ds_name || !concept_name || !notes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`📝 Updating DS note for user ${user.id}: ${id}`);

    const { data, error } = await supabase
      .from("ds_notes")
      .update({
        ds_name,
        concept_name,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) {
      console.error("❌ Update error:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    console.log("✅ DS note updated successfully");
    return NextResponse.json({ data: data[0] }, { status: 200 });
  } catch (error) {
    console.error("DS notes update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    console.log(`🗑️ Deleting DS note for user ${user.id}: ${id}`);

    const { data, error } = await supabase
      .from("ds_notes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) {
      console.error("❌ Delete error:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    console.log("✅ DS note deleted successfully");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DS notes delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
