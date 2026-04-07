import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("habit_entries")
    .select("tracked_date")
    .order("tracked_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, marked } = body;

  if (!date || typeof marked !== "boolean") {
    return NextResponse.json(
      { error: "Date and marked flag are required" },
      { status: 400 }
    );
  }

  if (marked) {
    const { error } = await supabase
      .from("habit_entries")
      .upsert([{ tracked_date: date }], { onConflict: "tracked_date" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { date, marked } }, { status: 200 });
  }

  const { error } = await supabase
    .from("habit_entries")
    .delete()
    .eq("tracked_date", date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { date, marked } }, { status: 200 });
}
