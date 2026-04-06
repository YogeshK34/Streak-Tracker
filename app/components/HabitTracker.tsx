"use client";

import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isFuture,
  isPast,
  startOfDay,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MarkedDays {
  [key: string]: boolean;
}

export function HabitTracker() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [markedDays, setMarkedDays] = useState<MarkedDays>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("habit-tracker-days");
    if (stored) {
      setMarkedDays(JSON.parse(stored));
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever markedDays changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("habit-tracker-days", JSON.stringify(markedDays));
    }
  }, [markedDays, isLoaded]);

  // Get all days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0=Sunday, 1=Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();

  // Add empty cells at the beginning for days from previous month
  const emptyDaysAtStart = Array(firstDayOfWeek).fill(null);

  // Combine empty days with actual days
  const calendarDays = [...emptyDaysAtStart, ...daysInMonth];

  // Calculate current streak
  const calculateCurrentStreak = () => {
    let streak = 0;
    let currentDate = startOfDay(new Date());

    while (true) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      if (markedDays[dateStr]) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Calculate longest streak
  const calculateLongestStreak = () => {
    const sortedDates = Object.entries(markedDays)
      .filter(([, marked]) => marked)
      .map(([date]) => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (sortedDates.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currDate = sortedDates[i];
      const dayDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  };

  const currentStreak = calculateCurrentStreak();
  const longestStreak = calculateLongestStreak();

  const handleDayClick = (day: Date) => {
    // Don't allow marking future days
    if (isFuture(day)) {
      return;
    }

    const dateStr = format(day, "yyyy-MM-dd");
    setMarkedDays((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  if (!isLoaded) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-12 md:px-8">
      {/* Streak Card */}
      <Card className="mb-6 p-6 md:p-8 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-red-600 font-semibold">
              Current Streak
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-4xl md:text-5xl font-bold text-red-600">
                {currentStreak}
              </span>
              <span className="text-3xl">🔥</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              {currentStreak === 1 ? "day" : "days"} in a row
            </p>
          </div>
          {longestStreak > 0 && longestStreak !== currentStreak && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-600 font-semibold">
                Longest Streak
              </p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {longestStreak}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-6 md:p-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-semibold text-slate-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-xs font-semibold text-slate-600 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square rounded-lg bg-slate-50"
                />
              );
            }

            const dateStr = format(day, "yyyy-MM-dd");
            const isMarked = markedDays[dateStr];
            const isTodayDate = isToday(day);
            const isFutureDate = isFuture(day);

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(day)}
                disabled={isFutureDate}
                className={`
                  aspect-square rounded-lg relative group transition-all
                  ${isFutureDate ? "opacity-40 cursor-not-allowed bg-slate-100" : ""}
                  ${
                    isTodayDate
                      ? "ring-2 ring-offset-2 ring-cyan-500 bg-cyan-50"
                      : "bg-white border border-slate-200 hover:border-slate-300"
                  }
                  ${isMarked && !isFutureDate ? "bg-red-50 border-red-300" : ""}
                  ${!isFutureDate && "hover:shadow-md cursor-pointer"}
                `}
              >
                {/* Day number */}
                <div
                  className={`text-sm font-semibold absolute top-1 left-1 ${
                    isFutureDate
                      ? "text-slate-400"
                      : isTodayDate
                        ? "text-cyan-700"
                        : "text-slate-700"
                  }`}
                >
                  {format(day, "d")}
                </div>

                {/* Diagonal red line for marked days */}
                {isMarked && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="10"
                      y1="10"
                      x2="90"
                      y2="90"
                      stroke="#dc2626"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-cyan-50 ring-2 ring-cyan-500" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-50 border border-red-300 flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 100 100">
                <line
                  x1="10"
                  y1="10"
                  x2="90"
                  y2="90"
                  stroke="#dc2626"
                  strokeWidth="12"
                />
              </svg>
            </div>
            <span>Marked as done</span>
          </div>
        </div>
      </Card>
    </section>
  );
}
