"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { HabitTracker } from "./components/HabitTracker";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="relative isolate min-h-screen overflow-hidden py-10 md:py-14">
        <div className="pointer-events-none absolute inset-x-0 top-[-140px] -z-10 mx-auto h-[360px] w-[92%] rounded-[3rem] bg-gradient-to-r from-cyan-200/50 via-emerald-200/40 to-amber-200/45 blur-3xl" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-slate-600 dark:text-slate-400">Loading...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden py-10 md:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-[-140px] -z-10 mx-auto h-[360px] w-[92%] rounded-[3rem] bg-gradient-to-r from-cyan-200/50 via-emerald-200/40 to-amber-200/45 blur-3xl" />
      <div className="space-y-8">
        <div className="flex justify-end px-4 md:px-8">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">{user.email}</span>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10"
            >
              Sign Out
            </Button>
          </div>
        </div>
        <HabitTracker />
      </div>
    </main>
  );
}
