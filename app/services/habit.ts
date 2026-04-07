import { supabase } from "@/lib/supabase-client";

export type HabitDay = {
  date: string;
};

async function getAuthToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) {
    console.error("❌ Auth error:", error?.message || "No session");
    throw new Error("Not authenticated");
  }
  console.log("✅ Got auth token for user:", session.user.id);
  return session.access_token;
}

export async function getHabitDays() {
  try {
    const token = await getAuthToken();
    console.log("📥 Fetching habit days...");
    const res = await fetch("/api/habits", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({error: `HTTP ${res.status}`}));
      console.error("❌ Fetch failed:", res.status, error);
      throw new Error(`Failed to fetch habit data: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Fetched habits:", json.data?.length || 0, "days");
    return json as Promise<{ data: HabitDay[] }>;
  } catch (error) {
    console.error("❌ getHabitDays error:", error);
    throw error;
  }
}

export async function setHabitDay(date: string, marked: boolean) {
  try {
    const token = await getAuthToken();
    console.log(`📤 Saving ${marked ? "✓" : "✗"} for ${date}...`);
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date, marked }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({error: `HTTP ${res.status}`}));
      console.error("❌ Save failed:", res.status, error);
      throw new Error(`Failed to update habit data: ${res.status} - ${JSON.stringify(error)}`);
    }

    const json = await res.json();
    console.log("✅ Saved successfully:", json);
    return json;
  } catch (error) {
    console.error("❌ setHabitDay error:", error);
    throw error;
  }
}
