"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2, Plus, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getLeetCodeProblems,
  addLeetCodeProblem,
  deleteLeetCodeProblem,
  updateLeetCodeProblem,
  LeetCodeProblem,
} from "@/app/services/leetcode";
import { useAuth } from "@/lib/auth-context";

export function LeetCodeTracker() {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const itemsPerPage = 5;
  const [formData, setFormData] = useState({
    problem_date: format(new Date(), "yyyy-MM-dd"),
    problem_name: "",
    description: "",
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsLoaded(false);
      return;
    }

    loadProblems();
  }, [user]);

  const loadProblems = async () => {
    try {
      setError(null);
      const res = await getLeetCodeProblems();
      setProblems(res.data);
      setCurrentPage(1); // Reset to first page when loading
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to load LeetCode problems:", err);
      setError("Unable to load problems. Try refreshing.");
    } finally {
      setIsLoaded(true);
    }
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.problem_date || !formData.problem_name.trim()) {
      setError("Please fill in date and problem name");
      return;
    }

    try {
      setError(null);

      if (editingId) {
        await updateLeetCodeProblem(
          editingId,
          formData.problem_date,
          formData.problem_name,
          formData.description
        );
        setProblems((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  problem_date: formData.problem_date,
                  problem_name: formData.problem_name,
                  description: formData.description,
                }
              : p
          )
        );
      } else {
        const result = await addLeetCodeProblem(
          formData.problem_date,
          formData.problem_name,
          formData.description
        );
        // Refresh to get the newly added problem with id
        await loadProblems();
      }

      // Reset form
      setFormData({
        problem_date: format(new Date(), "yyyy-MM-dd"),
        problem_name: "",
        description: "",
      });
      setIsAddingProblem(false);
      setEditingId(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to save problem: ${errorMsg}`);
    }
  };

  const handleEdit = (problem: LeetCodeProblem) => {
    setEditingId(problem.id);
    const problemDate = new Date(problem.problem_date);
    setSelectedDate(problemDate);
    setFormData({
      problem_date: problem.problem_date,
      problem_name: problem.problem_name,
      description: problem.description || "",
    });
    setIsAddingProblem(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this problem?")) return;

    try {
      setError(null);
      await deleteLeetCodeProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete problem: ${errorMsg}`);
    }
  };

  const handleCancel = () => {
    setIsAddingProblem(false);
    setEditingId(null);
    setSelectedDate(new Date());
    setCalendarOpen(false);
    setFormData({
      problem_date: format(new Date(), "yyyy-MM-dd"),
      problem_name: "",
      description: "",
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData((prev) => ({
        ...prev,
        problem_date: format(date, "yyyy-MM-dd"),
      }));
      setCalendarOpen(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(problems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProblems = problems.slice(startIndex, endIndex);

  if (!isLoaded) {
    return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Loading LeetCode problems...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[2rem] border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-900/95 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/30">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Problems Solved</p>
              <CardTitle className="text-2xl font-semibold text-black dark:text-white">{problems.length} problems</CardTitle>
            </div>
            {!isAddingProblem && (
              <Button
                onClick={() => setIsAddingProblem(true)}
                className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
              >
                <Plus className="h-4 w-4" />
                Add Problem
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add/Edit Form */}
          {isAddingProblem && (
            <form onSubmit={handleAddOrUpdate} className="space-y-4 p-4 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/50">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Problem Date
                  </label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {format(selectedDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Problem Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Two Sum, LRU Cache"
                    value={formData.problem_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        problem_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description / Approach
                </label>
                <textarea
                  placeholder="Add your solution approach, key insights, or learning notes"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  {editingId ? "Update" : "Add"} Problem
                </Button>
              </div>
            </form>
          )}

          {/* Problems Table */}
          {problems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="text-sm">No problems added yet. Start tracking your LeetCode progress!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-700">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Problem Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Description</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProblems.map((problem) => (
                      <tr
                        key={problem.id}
                        className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                          {format(new Date(problem.problem_date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {problem.problem_name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {problem.description || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleEdit(problem)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(problem.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
