"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2, Plus, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface LeetCodeTrackerProps {
  onProblemCountChange?: (count: number) => void;
}

export function LeetCodeTracker({ onProblemCountChange }: LeetCodeTrackerProps = {}) {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<LeetCodeProblem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
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

  // Notify parent when problems count changes
  useEffect(() => {
    onProblemCountChange?.(problems.length);
  }, [problems.length, onProblemCountChange]);

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
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    try {
      setError(null);
      await deleteLeetCodeProblem(deletingId);
      setProblems((prev) => prev.filter((p) => p.id !== deletingId));
      setDeletingId(null);
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

  const handleOpenDetails = (problem: LeetCodeProblem) => {
    setSelectedProblem(problem);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedProblem(null);
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
    <div className="space-y-3 sm:space-y-4">
      <Card className="rounded-xl sm:rounded-[2rem] border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-900/95 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/30">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Problems Solved</p>
              <CardTitle className="text-lg sm:text-2xl font-semibold text-black dark:text-white">{problems.length} problems</CardTitle>
            </div>
            {!isAddingProblem && (
              <Button
                onClick={() => setIsAddingProblem(true)}
                className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 text-sm py-2 h-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Problem</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add/Edit Form */}
          {isAddingProblem && (
            <form onSubmit={handleAddOrUpdate} className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/50">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="problem-date" className="text-xs sm:text-sm">
                    Problem Date
                  </Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="problem-date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-xs sm:text-sm py-2 h-auto"
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

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="problem-name" className="text-xs sm:text-sm">
                    Problem Name *
                  </Label>
                  <Input
                    id="problem-name"
                    placeholder="e.g., Two Sum, LRU Cache"
                    value={formData.problem_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        problem_name: e.target.value,
                      }))
                    }
                    className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm">
                  Description / Approach
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add your solution approach, key insights, or learning notes"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="min-h-16 text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                >
                  {editingId ? "Update" : "Add"} Problem
                </Button>
              </div>
            </form>
          )}

          {/* Problems Table/Cards */}
          {problems.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-slate-500 dark:text-slate-400">
              <p className="text-xs sm:text-sm">No problems added yet. Start tracking your LeetCode progress!</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-700">
                      <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                      <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Problem Name</th>
                      <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Description</th>
                      <th className="text-center px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProblems.map((problem) => (
                      <tr
                        key={problem.id}
                        className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-slate-900 dark:text-slate-100">
                          {format(new Date(problem.problem_date), "MMM d, yyyy")}
                        </td>
                        <td
                          onClick={() => handleOpenDetails(problem)}
                          className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-slate-900 dark:text-slate-100 cursor-pointer hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                        >
                          {problem.problem_name}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {problem.description || "-"}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <Button
                              onClick={() => handleEdit(problem)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(problem.id)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2 sm:space-y-3">
                {paginatedProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetails(problem)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                          {format(new Date(problem.problem_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 break-words hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                          {problem.problem_name}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={() => handleEdit(problem)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(problem.id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {problem.description && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {problem.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 sm:mt-6 overflow-x-auto">
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
                            className="cursor-pointer text-xs sm:text-sm"
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

      <Dialog open={detailsDialogOpen} onOpenChange={handleCloseDetails}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <DialogTitle className="text-lg sm:text-xl font-semibold flex-1 pr-4">
              Problem Details
            </DialogTitle>
            <Button
              onClick={handleCloseDetails}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {/* <X className="h-4 w-4" /> */}
            </Button>
          </DialogHeader>

          {selectedProblem && (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-1">
                  Problem Name
                </p>
                <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 break-words">
                  {selectedProblem.problem_name}
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-1">
                  Date
                </p>
                <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  {format(new Date(selectedProblem.problem_date), "MMMM d, yyyy")}
                </p>
              </div>

              {selectedProblem.description && (
                <div>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-2">
                    Description / Approach
                  </p>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                    {selectedProblem.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2 justify-end">
                <Button
                  onClick={() => {
                    handleOpenDetails(selectedProblem);
                    setDetailsDialogOpen(false);
                    handleEdit(selectedProblem);
                  }}
                  className="gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Problem"
        description="Are you sure you want to delete this problem? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
