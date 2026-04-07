export type HabitDay = {
  date: string;
};

export async function getHabitDays() {
  const res = await fetch("/api/habits");

  if (!res.ok) {
    throw new Error(`Failed to fetch habit data: ${res.status}`);
  }

  return res.json() as Promise<{ data: HabitDay[] }>;
}

export async function setHabitDay(date: string, marked: boolean) {
  const res = await fetch("/api/habits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, marked }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update habit data: ${res.status}`);
  }

  return res.json();
}
