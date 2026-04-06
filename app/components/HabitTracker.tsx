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
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HabitData {
  [dateString: string]: boolean;
}

export function HabitTracker() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [habitData, setHabitData] = useState<HabitData>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Load habits from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("habits");
    if (stored) {
      const parsed = JSON.parse(stored);
      setHabitData(parsed);
      calculateStreaks(parsed);
    }
  }, []);

  // Calculate streaks whenever habit data changes
  const calculateStreaks = (data: HabitData) => {
    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    // Start from today and go backwards
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      if (data[dateStr]) {
        tempStreak++;
        current = tempStreak;
      } else {
        if (tempStreak > longest) {
          longest = tempStreak;
        }
        if (format(checkDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")) {
          // Today's date, if not done, streak is broken
          break;
        }
        tempStreak = 0;
      }
      checkDate = subDays(checkDate, 1);
    }

    setCurrentStreak(current);
    setLongestStreak(Math.max(longest, current));
  };

  const toggleDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    // Can't modify future days
    if (isFuture(date) && !isToday(date)) return;

    const newData = { ...habitData };
    newData[dateStr] = !newData[dateStr];
    setHabitData(newData);

    // Persist to localStorage
    localStorage.setItem("habits", JSON.stringify(newData));

    // Recalculate streaks
    calculateStreaks(newData);
  };

  const previousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get all days in the month
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding for days before the month starts (to align to week)
  const startingDayOfWeek = monthStart.getDay(); // 0 = Sunday, 1 = Monday
  const paddingDays = Array(startingDayOfWeek).fill(null);

  const calendarDays = [...paddingDays, ...allDays];

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-12 md:px-8">
      {/* Header */}
      <div className="surface-panel mb-6 rounded-3xl p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Habit Tracker
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Your Daily Streak
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 md:text-base">
              Mark your days as complete and build an unstoppable streak.
            </p>
          </div>
        </div>

        {/* Streak Display */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 p-4 border border-red-200/50">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">
              Current Streak
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-red-600">
                {currentStreak}
              </span>
              <span className="text-2xl">🔥</span>
              <span className="text-sm text-slate-600 ml-auto">
                {currentStreak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-emerald-50 p-4 border border-cyan-200/50">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">
              Longest Streak
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-cyan-600">
                {longestStreak}
              </span>
              <span className="text-2xl">⭐</span>
              <span className="text-sm text-slate-600 ml-auto">
                {longestStreak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="surface-panel rounded-3xl p-6 md:p-8">
        {/* Month Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition text-slate-600"
              title="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextMonth}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition text-slate-600"
              title="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold uppercase text-slate-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`padding-${index}`} className="aspect-square" />;
            }

            const dateStr = format(day, "yyyy-MM-dd");
            const isCompleted = habitData[dateStr] || false;
            const isTodayDate = isToday(day);
            const isFutureDate = isFuture(day);
            const isPastDate = isPast(day) && !isTodayDate;
            const canInteract = !isFutureDate || isTodayDate;

            return (
              <button
                key={dateStr}
                onClick={() => toggleDay(day)}
                disabled={isFutureDate && !isTodayDate}
                className={`
                  aspect-square relative rounded-lg font-semibold text-sm
                  transition-all duration-200 cursor-pointer
                  ${
                    !canInteract
                      ? "cursor-not-allowed bg-slate-50 text-slate-400"
                      : isCompleted
                        ? "bg-red-50 text-red-600 border-2 border-red-300"
                        : isTodayDate
                          ? "bg-cyan-100 text-slate-900 border-2 border-cyan-400 ring-2 ring-cyan-300/50"
                          : isPastDate
                            ? "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            : "bg-white text-slate-700 border border-slate-200"
                  }
                `}
              >
                <div className="w-full h-full flex items-center justify-center relative">
                  {format(day, "d")}

                  {/* Diagonal line for completed days */}
                  {isCompleted && (
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
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-100 border-2 border-cyan-400" />
            <span className="text-slate-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-50 border-2 border-red-300 relative">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <line
                  x1="10"
                  y1="10"
                  x2="90"
                  y2="90"
                  stroke="#dc2626"
                  strokeWidth="6"
                />
              </svg>
            </div>
            <span className="text-slate-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200" />
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200 opacity-50" />
            <span className="text-slate-400">Future</span>
          </div>
        </div>
      </div>
    </section>
  );
}
