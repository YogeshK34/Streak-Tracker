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
    throw new Error("Not authenticated");
  }
  return session.access_token;
}

export async function getHabitDays() {
  const token = await getAuthToken();
  const res = await fetch("/api/habits", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch habit data: ${res.status}`);
  }

  return res.json() as Promise<{ data: HabitDay[] }>;
}

export async function setHabitDay(date: string, marked: boolean) {
  const token = await getAuthToken();
  const res = await fetch("/api/habits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ date, marked }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update habit data: ${res.status}`);
  }

  return res.json();
}
