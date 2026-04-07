"use client";

import { HabitTracker } from "./components/HabitTracker";

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden py-10 md:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-[-140px] -z-10 mx-auto h-[360px] w-[92%] rounded-[3rem] bg-gradient-to-r from-cyan-200/50 via-emerald-200/40 to-amber-200/45 blur-3xl" />
      <div className="space-y-8">
        <HabitTracker />
      </div>
    </main>
  );
}
