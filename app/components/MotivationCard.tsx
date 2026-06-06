"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface MotivationCardProps {
  quote: string;
  streakCount: number;
}

export function MotivationCard({ quote, streakCount }: MotivationCardProps) {
  return (
    <Card className="border-0 shadow-2xl overflow-hidden">
      <CardContent className="bg-gradient-to-br from-slate-950 to-slate-900 p-12 text-center min-h-96 flex flex-col justify-center items-center space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Flame className="h-10 w-10 text-orange-500 fill-orange-500" />
          <span className="text-4xl font-bold text-white">{streakCount}</span>
          <span className="text-xl text-slate-300">Day Streak</span>
        </div>

        <p className="text-2xl font-bold text-white leading-tight max-w-lg">
          {quote}
        </p>

        <p className="text-sm text-slate-400">tracked with my habit tracker</p>
      </CardContent>
    </Card>
  );
}
